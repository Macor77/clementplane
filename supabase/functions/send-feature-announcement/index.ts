import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_APP_URL = 'https://app.formaplane.fr';

function safeAppUrl(value: unknown) {
  try {
    const parsed = new URL(String(value || DEFAULT_APP_URL));
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return DEFAULT_APP_URL;
    return parsed.origin;
  } catch {
    return DEFAULT_APP_URL;
  }
}
const SENDER_EMAIL = 'contact@formaplane.fr';

const esc = (s: string) =>
  String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const auth = req.headers.get('Authorization') || '';
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: auth } },
    });

    const { data: admin, error: adminError } = await userClient.rpc('is_platform_admin');
    if (adminError || !admin) throw new Error('ADMIN_REQUIRED');

    const { data: authData, error: userError } = await userClient.auth.getUser();
    if (userError || !authData.user) throw new Error('AUTH_REQUIRED');
    const user = authData.user;

    const body = await req.json();
    const action = String(body.action || 'send');
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();
    const audiences = Array.isArray(body.audiences) ? body.audiences : [];
    const appUrl = safeAppUrl(body.appBaseUrl);

    const serviceClient = createClient(url, service);

    // Le même calcul sert à l'aperçu et à l'envoi réel.
    const { data: payload, error: payloadError } = await userClient.rpc(
      'admin_feature_news_recipient_payload',
      { p_audiences: audiences },
    );
    if (payloadError) throw payloadError;

    if (action === 'preview') {
      return new Response(
        JSON.stringify({
          ok: true,
          selected_total: Number(payload?.selected_total || 0),
          eligible: Number(payload?.eligible || 0),
          unsubscribed_selected: Number(payload?.unsubscribed_selected || 0),
        }),
        { headers: { ...cors, 'content-type': 'application/json' } },
      );
    }

    if (!subject || !message) throw new Error('SUBJECT_MESSAGE_REQUIRED');

    const apiKey = Deno.env.get('BREVO_API_KEY');
    if (!apiKey) throw new Error('BREVO_API_KEY_MISSING');

    let recipients: any[] = [];

    if (action === 'test') {
      // Le test contient lui aussi le vrai parcours de désabonnement afin de pouvoir le vérifier.
      await serviceClient
        .from('feature_news_preferences')
        .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

      const { data: preference, error: prefError } = await serviceClient
        .from('feature_news_preferences')
        .select('unsubscribe_token')
        .eq('user_id', user.id)
        .single();

      if (prefError) throw prefError;

      recipients = [{
        user_id: user.id,
        email: user.email,
        first_name: '',
        unsubscribe_token: preference.unsubscribe_token,
      }];
    } else {
      recipients = Array.isArray(payload?.recipients) ? payload.recipients : [];
    }

    let announcementId: string | null = null;

    if (action !== 'test') {
      const { data, error } = await serviceClient
        .from('feature_announcements')
        .insert({
          subject,
          message,
          audiences,
          eligible_count: recipients.length,
          created_by_user_id: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      announcementId = data.id;
    }

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const unsubscribeUrl =
        `${appUrl}/desabonnement-nouveautes?token=${encodeURIComponent(recipient.unsubscribe_token)}`;

      const paragraphs = message
        .split(/\n+/)
        .filter(Boolean)
        .map((p: string) => `<p style="margin:0 0 16px">${esc(p)}</p>`)
        .join('');

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#10234a;line-height:1.5">
<h1 style="font-size:24px;line-height:1.25;margin:0 0 20px">${esc(subject)}</h1>

          ${paragraphs}

          <p style="margin-top:28px">
            <a
              href="${appUrl}"
              style="display:inline-block;border:1px solid #bfd0eb;color:#315b96;text-decoration:none;padding:9px 13px;border-radius:7px;font-weight:600;font-size:13px;background:#ffffff"
            >
              Se connecter à mon espace
            </a>
          </p>

          <hr style="border:0;border-top:1px solid #e5e7eb;margin:34px 0 18px">

          <p style="font-size:12px;color:#64748b;margin:0 0 10px">
            Vous recevez cet e-mail pour être informé(e) des mises à jour et nouveautés de Formaplane.
          </p>
          <p style="font-size:12px;color:#64748b;margin:0">
            Vous pouvez
            <a href="${unsubscribeUrl}" style="color:#475569;text-decoration:underline">
              vous désabonner des e-mails de nouveautés Formaplane
            </a>.
            Ce désabonnement ne concerne pas les e-mails nécessaires à votre activité sur Formaplane
            (propositions de mission, réponses, affectations, modifications de mission et autres notifications transactionnelles).
          </p>
        </div>
      `;

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Formaplane', email: SENDER_EMAIL },
          to: [{ email: recipient.email }],
          subject,
          htmlContent: html,
        }),
      });

      if (response.ok) {
        sent += 1;
        await serviceClient.from('email_logs').insert({
          recipient_email: recipient.email,
          recipient_user_id: recipient.user_id,
          email_type: 'feature_announcement',
          status: 'sent',
          requested_by_user_id: user.id,
        });
      } else {
        failed += 1;
      }
    }

    if (announcementId) {
      await serviceClient
        .from('feature_announcements')
        .update({
          sent_count: sent,
          failed_count: failed,
          sent_at: new Date().toISOString(),
        })
        .eq('id', announcementId);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent,
        failed,
        eligible: recipients.length,
      }),
      { headers: { ...cors, 'content-type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: String(error?.message || error) }),
      { status: 400, headers: { ...cors, 'content-type': 'application/json' } },
    );
  }
});
