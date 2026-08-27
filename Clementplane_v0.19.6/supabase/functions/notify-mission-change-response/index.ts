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
    const response = String(body?.response || '').trim();

    if (
      !token ||
      !['accepted', 'refused'].includes(response)
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

    const { data: target, error: targetError } =
      await admin
        .from('mission_change_request_trainers')
        .select(`
          id,
          change_request_id,
          mission_formateur_id,
          trainer_id,
          previous_status,
          response_status,
          response_comment,
          responded_at
        `)
        .eq('public_response_token', token)
        .maybeSingle();

    if (targetError || !target) {
      return jsonResponse(
        {
          success: false,
          message: 'Demande de revalidation introuvable.',
        },
        404,
      );
    }

    if (
      target.response_status !== response ||
      !target.responded_at
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
      response === 'accepted'
        ? 'mission_change_response_accepted'
        : 'mission_change_response_refused';

    const { data: existingLogs, error: existingLogsError } =
      await admin
        .from('email_logs')
        .select('id, status, metadata')
        .eq('email_type', emailType)
        .eq(
          'related_entity_type',
          'mission_change_request_trainer',
        )
        .eq('related_entity_id', target.id)
        .in('status', ['pending', 'sent', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(20);

    if (existingLogsError) {
      return jsonResponse(
        {
          success: false,
          message:
            "Impossible de vérifier l'historique des notifications.",
        },
        500,
      );
    }

    const respondedAt = String(target.responded_at || '');

    const duplicateLog = (
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
        respondedAt
      );
    });

    if (duplicateLog) {
      return jsonResponse({
        success: true,
        duplicate: true,
        logId: duplicateLog.id,
      });
    }

    const { data: changeRequest, error: requestError } =
      await admin
        .from('mission_change_requests')
        .select('id, mission_id, organization_id')
        .eq('id', target.change_request_id)
        .maybeSingle();

    if (requestError || !changeRequest) {
      return jsonResponse(
        {
          success: false,
          message:
            'Demande de modification introuvable.',
        },
        404,
      );
    }

    const [
      { data: mission, error: missionError },
      { data: trainer, error: trainerError },
      { data: dates, error: datesError },
      { data: organization, error: organizationError },
      { data: members, error: membersError },
    ] = await Promise.all([
      admin
        .from('missions')
        .select(`
          id,
          intitule,
          formation,
          client,
          lieu,
          adresse,
          code_postal,
          ville
        `)
        .eq('id', changeRequest.mission_id)
        .maybeSingle(),

      admin
        .from('trainers')
        .select('id, prenom, nom')
        .eq('id', target.trainer_id)
        .maybeSingle(),

      admin
        .from('mission_dates')
        .select('date, heure_debut, heure_fin')
        .eq('mission_id', changeRequest.mission_id)
        .order('date', { ascending: true })
        .order('heure_debut', { ascending: true }),

      admin
        .from('organizations')
        .select('id, name, legal_name')
        .eq('id', changeRequest.organization_id)
        .maybeSingle(),

      admin
        .from('organization_members')
        .select('user_id, role, joined_at, created_at')
        .eq('organization_id', changeRequest.organization_id)
        .eq('status', 'active'),
    ]);

    if (missionError || !mission) {
      return jsonResponse(
        { success: false, message: 'Mission introuvable.' },
        404,
      );
    }

    if (trainerError || !trainer) {
      return jsonResponse(
        { success: false, message: 'Formateur introuvable.' },
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

    if (organizationError || !organization) {
      return jsonResponse(
        {
          success: false,
          message: 'Organisme introuvable.',
        },
        404,
      );
    }

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

    const accepted = response === 'accepted';
    const wasAssigned = target.previous_status === 'affecte';

    const safeTrainerName = escapeHtml(trainerName);
    const safeMissionTitle = escapeHtml(missionTitle);
    const safeOrganizationName =
      escapeHtml(organizationName);
    const safeLocation = escapeHtml(location);
    const safeComment = escapeHtml(
      String(target.response_comment || ''),
    );
    const safeRecipientFirstName = escapeHtml(
      recipientFirstName,
    );

    const missionUrl =
      `${APP_URL}/missions/${mission.id}?space=organization`;
    const safeMissionUrl = escapeHtml(missionUrl);

    const subject = accepted
      ? `${trainerName} a accepté les nouvelles conditions de la mission`
      : `${trainerName} a refusé les nouvelles conditions de la mission`;

    const headline = accepted
      ? `${safeTrainerName} maintient son accord`
      : `${safeTrainerName} refuse les nouvelles conditions`;

    const explanatoryText = accepted
      ? (
          wasAssigned
            ? 'Le formateur vient de confirmer qu’il accepte les nouvelles conditions de cette mission qui était déjà confirmée.'
            : 'Le formateur vient de confirmer qu’il maintient son accord sur cette proposition malgré les modifications.'
        )
      : (
          wasAssigned
            ? 'Le formateur ne maintient pas son accord après la modification. Son affectation n’est donc plus confirmée.'
            : 'Le formateur ne maintient pas son accord sur la proposition après la modification.'
        );

    const actionBox = accepted
      ? (
          wasAssigned
            ? `
              <div style="margin-bottom:20px;padding:16px 17px;border:1px solid #bbf7d0;border-radius:12px;background:#f0fdf4;">
                <div style="font-size:14px;font-weight:800;color:#15803d;margin-bottom:5px;">
                  Revalidation acceptée
                </div>
                <div style="font-size:13px;line-height:1.55;color:#475569;">
                  Le formateur maintient son accord sur les nouvelles conditions.
                  Vous pouvez poursuivre la préparation de la mission.
                </div>
              </div>
            `
            : `
              <div style="margin-bottom:20px;padding:16px 17px;border:1px solid #bfdbfe;border-radius:12px;background:#eff6ff;">
                <div style="font-size:14px;font-weight:800;color:#1d4ed8;margin-bottom:5px;">
                  Accord maintenu
                </div>
                <div style="font-size:13px;line-height:1.55;color:#475569;">
                  Le formateur accepte toujours la mission avec les nouvelles conditions.
                  Vous pouvez poursuivre votre processus d’affectation.
                </div>
              </div>
            `
        )
      : `
        <div style="margin-bottom:20px;padding:14px 16px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;font-size:13px;line-height:1.55;color:#854d0e;">
          Le formateur a refusé les nouvelles conditions.
          Revenez sur la mission dans Clementplane pour vérifier son statut et poursuivre l’organisation avec un autre formateur si nécessaire.
        </div>
      `;

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
      subject,
      htmlContent: `
        <div style="margin:0;padding:40px 20px;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
          <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #dbe3ef;border-radius:18px;padding:36px;box-sizing:border-box;">
            <div style="font-size:24px;font-weight:800;margin-bottom:28px;color:#0f2747;">Clementplane</div>

            <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:${accepted ? '#15803d' : '#b45309'};text-transform:uppercase;margin-bottom:10px;">
              Réponse à une modification de mission
            </div>

            <h1 style="margin:0 0 14px 0;font-size:25px;line-height:1.25;color:#0f2747;">
              ${headline}
            </h1>

            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#5b6b82;">
              ${
                safeRecipientFirstName
                  ? `Bonjour ${safeRecipientFirstName}, `
                  : ''
              }${explanatoryText}
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

            ${actionBox}

            <a
              href="${safeMissionUrl}"
              style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 18px;border-radius:10px;"
            >
              Voir la mission dans Clementplane
            </a>

            <div style="margin-top:26px;padding-top:18px;border-top:1px solid #dbe3ef;font-size:11px;line-height:1.5;color:#94a3b8;">
              Clementplane<br />
              Suivez vos propositions, revalidations et affectations simplement.
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
      organization_id: changeRequest.organization_id,
      related_entity_type:
        'mission_change_request_trainer',
      related_entity_id: target.id,
      status: 'pending',
      metadata: {
        source:
          'trainer_public_mission_change_response',
        mission_id: mission.id,
        mission_change_request_id:
          changeRequest.id,
        trainer_id: trainer.id,
        trainer_name: trainerName,
        organization_name: organizationName,
        previous_status: target.previous_status,
        response_status: response,
        response_comment:
          target.response_comment || null,
        responded_at: target.responded_at,
      },
    };

    const { data: log, error: logError } =
      await admin
        .from('email_logs')
        .insert(logPayload)
        .select('id')
        .single();

    if (logError || !log?.id) {
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
      'Erreur notify-mission-change-response :',
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
