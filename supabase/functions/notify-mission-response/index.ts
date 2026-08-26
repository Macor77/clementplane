import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'contact@clementplane.fr';
const SENDER_NAME = 'Clementplane';
const APP_URL = 'https://app.clementplane.fr';

const jsonResponse = (
  body: Record<string, unknown>,
  status = 200,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const escapeHtml = (value: string) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const formatMissionDate = (value: string) => {
  const [year, month, day] = String(value || '')
    .split('-')
    .map(Number);

  if (!year || !month || !day) {
    return String(value || '');
  }

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const formatMissionTime = (
  value: string | null | undefined,
) => {
  if (!value) return '';
  return String(value).slice(0, 5);
};

const roleRank = (role: string) => {
  if (role === 'owner') return 1;
  if (role === 'admin') return 2;
  if (role === 'manager') return 3;
  return 4;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { success: false, message: 'Méthode non autorisée.' },
      405,
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');

    if (!supabaseUrl || !serviceRoleKey || !brevoApiKey) {
      console.error(
        'Configuration serveur incomplète pour notify-mission-response.',
      );
      return jsonResponse(
        {
          success: false,
          message:
            "Le service de notification n'est pas correctement configuré.",
        },
        500,
      );
    }

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || '').trim();
    const requestedResponse = String(
      body?.response || '',
    ).trim();

    if (
      !token ||
      !['accepte', 'refuse'].includes(requestedResponse)
    ) {
      return jsonResponse(
        { success: false, message: 'Requête invalide.' },
        400,
      );
    }

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data: relation, error: relationError } =
      await admin
        .from('mission_formateurs')
        .select(`
          id,
          mission_id,
          formateur_id,
          statut,
          response_comment,
          repondu_le
        `)
        .eq('proposal_token', token)
        .maybeSingle();

    if (relationError || !relation) {
      return jsonResponse(
        {
          success: false,
          message: 'Proposition introuvable.',
        },
        404,
      );
    }

    // Empêche qu'un token ancien ou manipulé déclenche une notification
    // ne correspondant pas à la réponse réellement enregistrée.
    if (
      relation.statut !== requestedResponse ||
      !relation.repondu_le
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "La réponse enregistrée ne correspond pas à la notification demandée.",
        },
        409,
      );
    }

    const emailType =
      requestedResponse === 'accepte'
        ? 'mission_response_accepted'
        : 'mission_response_refused';

    // Idempotence limitée à la réponse actuellement enregistrée.
    //
    // Une même relation mission_formateur peut être réinitialisée puis
    // recevoir une nouvelle réponse. Dans ce cas, relation.repondu_le change
    // et un nouvel e-mail doit être envoyé.
    //
    // En revanche, si le navigateur répète l'appel pour exactement la même
    // réponse (même statut + même repondu_le), on ne renvoie pas le mail.
    const { data: existingLogs, error: existingLogsError } =
      await admin
        .from('email_logs')
        .select('id, status, metadata')
        .eq('email_type', emailType)
        .eq('related_entity_type', 'mission_formateur')
        .eq('related_entity_id', relation.id)
        .in('status', ['pending', 'sent', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(20);

    if (existingLogsError) {
      console.error(
        'Impossible de vérifier les notifications existantes :',
        existingLogsError,
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Impossible de vérifier l'historique des notifications.",
        },
        500,
      );
    }

    const currentRespondedAt = String(
      relation.repondu_le || '',
    );

    const existingLog = (
      Array.isArray(existingLogs)
        ? existingLogs
        : []
    ).find((item) => {
      const metadata =
        item?.metadata &&
        typeof item.metadata === 'object'
          ? item.metadata
          : {};

      return (
        String(metadata?.responded_at || '') ===
        currentRespondedAt
      );
    });

    if (existingLog) {
      return jsonResponse({
        success: true,
        duplicate: true,
        logId: existingLog.id,
      });
    }

    const [
      { data: mission, error: missionError },
      { data: trainer, error: trainerError },
      { data: dates, error: datesError },
    ] = await Promise.all([
      admin
        .from('missions')
        .select(`
          id,
          organization_id,
          intitule,
          formation,
          client,
          lieu,
          adresse,
          code_postal,
          ville
        `)
        .eq('id', relation.mission_id)
        .maybeSingle(),
      admin
        .from('trainers')
        .select('id, prenom, nom')
        .eq('id', relation.formateur_id)
        .maybeSingle(),
      admin
        .from('mission_dates')
        .select('date, heure_debut, heure_fin')
        .eq('mission_id', relation.mission_id)
        .order('date', { ascending: true })
        .order('heure_debut', { ascending: true }),
    ]);

    if (missionError || !mission) {
      return jsonResponse(
        { success: false, message: 'Mission introuvable.' },
        404,
      );
    }

    if (trainerError || !trainer) {
      return jsonResponse(
        {
          success: false,
          message: 'Formateur introuvable.',
        },
        404,
      );
    }

    if (datesError) {
      return jsonResponse(
        {
          success: false,
          message:
            "Impossible de charger les dates de la mission.",
        },
        500,
      );
    }

    const organizationId = String(
      mission.organization_id || '',
    );

    const { data: organization, error: organizationError } =
      await admin
        .from('organizations')
        .select('id, name, legal_name')
        .eq('id', organizationId)
        .maybeSingle();

    if (organizationError || !organization) {
      return jsonResponse(
        {
          success: false,
          message: 'Organisme introuvable.',
        },
        404,
      );
    }

    const { data: members, error: membersError } =
      await admin
        .from('organization_members')
        .select('user_id, role, joined_at, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

    if (membersError || !Array.isArray(members)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Impossible d'identifier le destinataire de l'organisme.",
        },
        500,
      );
    }

    const orderedMembers = [...members].sort((a, b) => {
      const rankDiff =
        roleRank(String(a.role || '')) -
        roleRank(String(b.role || ''));

      if (rankDiff !== 0) return rankDiff;

      const aDate = new Date(
        a.joined_at || a.created_at || 0,
      ).getTime();
      const bDate = new Date(
        b.joined_at || b.created_at || 0,
      ).getTime();

      return aDate - bDate;
    });

    let recipientUserId = '';
    let recipientEmail = '';
    let recipientFirstName = '';

    for (const member of orderedMembers) {
      const userId = String(member.user_id || '');
      if (!userId) continue;

      const [
        { data: userResult },
        { data: profile },
      ] = await Promise.all([
        admin.auth.admin.getUserById(userId),
        admin
          .from('profiles')
          .select('first_name')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      const email = String(
        userResult?.user?.email || '',
      )
        .trim()
        .toLowerCase();

      if (email) {
        recipientUserId = userId;
        recipientEmail = email;
        recipientFirstName = String(
          profile?.first_name || '',
        ).trim();
        break;
      }
    }

    if (!recipientEmail) {
      return jsonResponse(
        {
          success: false,
          message:
            "Aucune adresse e-mail active n'a été trouvée pour l'organisme.",
        },
        409,
      );
    }

    const organizationName = String(
      organization.name ||
        organization.legal_name ||
        'Votre organisme',
    ).trim();

    const trainerName = [
      trainer.prenom,
      trainer.nom,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Le formateur';

    const missionTitle = String(
      mission.intitule ||
        mission.formation ||
        'Mission de formation',
    ).trim();

    const location = [
      mission.adresse,
      [mission.code_postal, mission.ville]
        .filter(Boolean)
        .join(' '),
    ]
      .filter(Boolean)
      .join(' — ') || mission.lieu || '';

    const dateRows = (Array.isArray(dates) ? dates : [])
      .map((item) => {
        const day = escapeHtml(
          formatMissionDate(item.date || ''),
        );
        const start = escapeHtml(
          formatMissionTime(item.heure_debut),
        );
        const end = escapeHtml(
          formatMissionTime(item.heure_fin),
        );
        const hours =
          start && end
            ? `${start} – ${end}`
            : start || end || '';

        return `
          <div style="padding:7px 0;border-bottom:1px solid #edf1f5;">
            <strong style="color:#0f2747;">${day}</strong>
            ${
              hours
                ? `<span style="color:#64748b;"> · ${hours}</span>`
                : ''
            }
          </div>
        `;
      })
      .join('');

    const safeTrainerName = escapeHtml(trainerName);
    const safeMissionTitle = escapeHtml(missionTitle);
    const safeOrganizationName =
      escapeHtml(organizationName);
    const safeLocation = escapeHtml(location);
    const safeComment = escapeHtml(
      String(relation.response_comment || ''),
    );
    const safeRecipientFirstName = escapeHtml(
      recipientFirstName,
    );
    const missionUrl =
      `${APP_URL}/missions/${mission.id}?space=organization`;
    const safeMissionUrl = escapeHtml(missionUrl);

    const accepted =
      requestedResponse === 'accepte';

    const emailPayload: Record<string, unknown> = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      to: [{ email: recipientEmail }],
      replyTo: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      subject: accepted
        ? `${trainerName} a accepté votre proposition de mission`
        : `${trainerName} a refusé votre proposition de mission`,
      htmlContent: `
        <div style="margin:0;padding:40px 20px;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
          <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #dbe3ef;border-radius:18px;padding:36px;box-sizing:border-box;">
            <div style="font-size:24px;font-weight:800;margin-bottom:28px;color:#0f2747;">Clementplane</div>

            <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:${accepted ? '#15803d' : '#b45309'};text-transform:uppercase;margin-bottom:10px;">
              Réponse à une proposition de mission
            </div>

            <h1 style="margin:0 0 14px 0;font-size:25px;line-height:1.25;color:#0f2747;">
              ${safeTrainerName} a ${accepted ? 'accepté' : 'refusé'} votre proposition
            </h1>

            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#5b6b82;">
              ${
                safeRecipientFirstName
                  ? `Bonjour ${safeRecipientFirstName}, `
                  : ''
              }le formateur vient de répondre à la proposition envoyée par ${safeOrganizationName}.
            </p>

            <div style="border:1px solid #dbe3ef;border-radius:12px;padding:18px;margin-bottom:18px;background:#f8fafc;">
              <div style="font-size:18px;font-weight:800;color:#0f2747;margin-bottom:10px;">
                ${safeMissionTitle}
              </div>
              ${
                safeLocation
                  ? `<div style="font-size:14px;color:#475569;"><strong>Lieu :</strong> ${safeLocation}</div>`
                  : ''
              }
              ${
                dateRows
                  ? `<div style="margin-top:12px;font-size:13px;line-height:1.5;">${dateRows}</div>`
                  : ''
              }
            </div>

            ${
              safeComment
                ? `
                  <div style="margin-bottom:18px;padding:15px 16px;border-left:4px solid #94a3b8;background:#f8fafc;border-radius:8px;">
                    <div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:5px;">
                      Commentaire du formateur
                    </div>
                    <div style="font-size:14px;line-height:1.55;color:#334155;">
                      ${safeComment}
                    </div>
                  </div>
                `
                : ''
            }

            ${
              accepted
                ? `
                  <div style="margin-bottom:20px;padding:16px 17px;border:1px solid #bfdbfe;border-radius:12px;background:#eff6ff;">
                    <div style="font-size:14px;font-weight:800;color:#1d4ed8;margin-bottom:5px;">
                      Une dernière étape est nécessaire
                    </div>
                    <div style="font-size:13px;line-height:1.55;color:#475569;">
                      L’acceptation du formateur ne confirme pas encore définitivement la mission.
                      Ouvrez la mission dans Clementplane puis cliquez sur <strong>« Affecter »</strong>
                      pour confirmer ce formateur sur la mission.
                    </div>
                  </div>
                `
                : `
                  <div style="margin-bottom:20px;padding:14px 16px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;font-size:13px;line-height:1.55;color:#854d0e;">
                    Le formateur a refusé cette proposition. Vous pouvez revenir sur la mission pour poursuivre votre recherche ou proposer la mission à un autre formateur.
                  </div>
                `
            }

            <a
              href="${safeMissionUrl}"
              style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 18px;border-radius:10px;"
            >
              Voir la mission dans Clementplane
            </a>

            <div style="margin-top:26px;padding-top:18px;border-top:1px solid #dbe3ef;font-size:11px;line-height:1.5;color:#94a3b8;">
              Clementplane<br />
              Suivez vos propositions et affectations simplement.
            </div>
          </div>
        </div>
      `,
    };

    const logPayload = {
      email_type: emailType,
      provider: 'brevo',
      recipient_email: recipientEmail,
      recipient_user_id: recipientUserId || null,
      requested_by_user_id: null,
      organization_id: organizationId,
      related_entity_type: 'mission_formateur',
      related_entity_id: relation.id,
      status: 'pending',
      metadata: {
        source: 'trainer_public_mission_response',
        mission_id: mission.id,
        trainer_id: trainer.id,
        trainer_name: trainerName,
        organization_name: organizationName,
        response_status: requestedResponse,
        response_comment:
          relation.response_comment || null,
        responded_at: relation.repondu_le,
      },
    };

    const { data: log, error: logError } =
      await admin
        .from('email_logs')
        .insert(logPayload)
        .select('id')
        .single();

    if (logError || !log?.id) {
      console.error(
        'Impossible de créer le journal e-mail :',
        logError,
      );
      return jsonResponse(
        {
          success: false,
          message:
            "La notification n'a pas pu être journalisée.",
        },
        500,
      );
    }

    emailPayload.headers = {
      'X-Mailin-custom':
        `formaplane_log_id:${log.id}`,
    };

    const brevoResponse = await fetch(
      BREVO_ENDPOINT,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      },
    );

    const rawProviderResponse =
      await brevoResponse.text();

    let providerResponse:
      Record<string, unknown> = {};

    if (rawProviderResponse) {
      try {
        providerResponse =
          JSON.parse(rawProviderResponse);
      } catch {
        providerResponse = {
          raw: rawProviderResponse,
        };
      }
    }

    if (!brevoResponse.ok) {
      await admin
        .from('email_logs')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message:
            String(
              providerResponse?.message ||
                rawProviderResponse ||
                'Erreur Brevo',
            ),
        })
        .eq('id', log.id);

      console.error(
        'Brevo a refusé la notification de réponse :',
        providerResponse,
      );

      return jsonResponse(
        {
          success: false,
          message:
            "La réponse est enregistrée, mais l'e-mail à l'organisme n'a pas pu être envoyé.",
        },
        502,
      );
    }

    const providerMessageId = String(
      providerResponse?.messageId || '',
    ).trim();

    await admin
      .from('email_logs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_message_id:
          providerMessageId || null,
        error_message: null,
      })
      .eq('id', log.id);

    return jsonResponse({
      success: true,
      logId: log.id,
      providerMessageId:
        providerMessageId || null,
    });
  } catch (error) {
    console.error(
      'Erreur notify-mission-response :',
      error,
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Une erreur inattendue a empêché la notification de l'organisme.",
      },
      500,
    );
  }
});
