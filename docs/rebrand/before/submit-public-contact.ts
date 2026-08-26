import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'contact@formaplane.fr';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'Formaplane';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const clean = (value: unknown, max: number) =>
  String(value ?? '').trim().slice(0, max);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Méthode non autorisée.' }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing Supabase service configuration');
    return jsonResponse({ success: false, message: 'Service temporairement indisponible.' }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, message: 'Requête invalide.' }, 400);
  }

  const firstName = clean(body.firstName, 80);
  const lastName = clean(body.lastName, 80);
  const email = clean(body.email, 254).toLowerCase();
  const profile = clean(body.profile, 30);
  const message = clean(body.message, 5000);
  const website = clean(body.website, 250);
  const startedAt = Number(body.startedAt || 0);

  if (website) {
    // Honeypot : réponse neutre afin de ne pas renseigner les robots.
    return jsonResponse({ success: true });
  }

  if (!firstName || !lastName) {
    return jsonResponse({ success: false, message: 'Votre prénom et votre nom sont obligatoires.' }, 400);
  }

  if (!email || !emailPattern.test(email)) {
    return jsonResponse({ success: false, message: 'Veuillez renseigner une adresse e-mail valide.' }, 400);
  }

  if (!['organization', 'trainer', 'other'].includes(profile)) {
    return jsonResponse({ success: false, message: 'Profil invalide.' }, 400);
  }

  if (!message) {
    return jsonResponse({ success: false, message: 'Votre message est obligatoire.' }, 400);
  }

  if (message.length > 5000) {
    return jsonResponse({ success: false, message: 'Votre message est trop long.' }, 400);
  }

  // Les soumissions instantanées sont typiques des robots.
  if (startedAt && Date.now() - startedAt < 1800) {
    return jsonResponse({ success: false, message: 'Merci de patienter un instant avant l’envoi.' }, 429);
  }

  const forwardedFor = req.headers.get('x-forwarded-for') || '';
  const clientIp = forwardedFor.split(',')[0].trim() || 'unknown';
  const identifierHash = await sha256(`${clientIp}|${email}`);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 4;

  const { data: rateRow, error: rateReadError } = await admin
    .from('public_contact_rate_limits')
    .select('identifier_hash, window_started_at, request_count')
    .eq('identifier_hash', identifierHash)
    .maybeSingle();

  if (rateReadError) {
    console.error('Rate-limit read error', rateReadError);
    return jsonResponse({ success: false, message: 'Service temporairement indisponible.' }, 503);
  }

  let nextCount = 1;
  let windowStartedAt = now.toISOString();

  if (rateRow) {
    const currentWindow = new Date(rateRow.window_started_at).getTime();
    const stillInWindow = Number.isFinite(currentWindow) && now.getTime() - currentWindow < windowMs;

    if (stillInWindow) {
      if (Number(rateRow.request_count || 0) >= maxRequests) {
        return jsonResponse({
          success: false,
          message: 'Trop de messages ont été envoyés récemment. Merci de réessayer dans quelques minutes.',
        }, 429);
      }

      nextCount = Number(rateRow.request_count || 0) + 1;
      windowStartedAt = rateRow.window_started_at;
    }
  }

  const { error: rateWriteError } = await admin
    .from('public_contact_rate_limits')
    .upsert({
      identifier_hash: identifierHash,
      window_started_at: windowStartedAt,
      request_count: nextCount,
      updated_at: now.toISOString(),
    });

  if (rateWriteError) {
    console.error('Rate-limit write error', rateWriteError);
    return jsonResponse({ success: false, message: 'Service temporairement indisponible.' }, 503);
  }

  const audience = profile === 'organization'
    ? 'organization'
    : profile === 'trainer'
      ? 'trainer'
      : 'public';

  const profileLabel = profile === 'organization'
    ? 'Organisme de formation'
    : profile === 'trainer'
      ? 'Formateur indépendant'
      : 'Autre';

  const { data: category, error: categoryError } = await admin
    .from('support_request_categories')
    .select('key, label')
    .eq('key', 'general_question')
    .eq('is_active', true)
    .maybeSingle();

  if (categoryError || !category) {
    console.error('Category lookup error', categoryError);
    return jsonResponse({ success: false, message: 'Service temporairement indisponible.' }, 503);
  }

  const { data: supportRequest, error: insertError } = await admin
    .from('support_requests')
    .insert({
      requester_user_id: null,
      requester_email: email,
      requester_first_name: firstName,
      requester_last_name: lastName,
      requester_profile: profile,
      audience,
      organization_id: null,
      trainer_id: null,
      category_key: category.key,
      category: category.label,
      message,
      app_version: 'public-landing',
      status: 'new',
      priority: 'normal',
      source: 'public',
      tags: ['landing_page'],
    })
    .select('id, created_at')
    .single();

  if (insertError || !supportRequest) {
    console.error('Public contact insert error', insertError);
    return jsonResponse({ success: false, message: "Impossible d'enregistrer votre demande pour le moment." }, 500);
  }

  let notificationSent = false;

  if (BREVO_API_KEY) {
    const requesterName = `${firstName} ${lastName}`.trim();

    const emailPayload = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: SENDER_EMAIL }],
      replyTo: { email, name: requesterName },
      subject: `[Contact public Formaplane] ${profileLabel}`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;background:#f5f7fb;padding:24px;color:#0f172a;">
          <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #dbe3ef;border-radius:14px;padding:24px;">
            <div style="font-size:12px;font-weight:800;letter-spacing:.06em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
              Nouveau contact depuis la landing page
            </div>
            <h1 style="font-size:22px;line-height:1.3;margin:0 0 18px;">${escapeHtml(profileLabel)}</h1>
            <div style="font-size:14px;line-height:1.65;color:#334155;">
              <p><strong>Demandeur :</strong> ${escapeHtml(requesterName)}</p>
              <p><strong>Profil :</strong> ${escapeHtml(profileLabel)}</p>
              <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
              <div style="margin-top:18px;padding:16px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(message)}</div>
              <p style="margin-top:18px;color:#64748b;font-size:12px;">Référence : ${escapeHtml(String(supportRequest.id))}</p>
            </div>
          </div>
        </div>
      `,
    };

    const { data: log, error: logError } = await admin
      .from('email_logs')
      .insert({
        email_type: 'public_contact_notification',
        provider: 'brevo',
        recipient_email: SENDER_EMAIL,
        recipient_user_id: null,
        requested_by_user_id: null,
        related_entity_type: 'support_request',
        related_entity_id: supportRequest.id,
        status: 'pending',
        metadata: {
          source: 'public_landing_contact',
          requester_profile: profile,
          audience,
        },
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Email log create error', logError);
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      const raw = await response.text();
      let provider: Record<string, unknown> = {};
      try {
        provider = raw ? JSON.parse(raw) : {};
      } catch {
        provider = {};
      }

      if (!response.ok) {
        const errorMessage =
          typeof provider.message === 'string'
            ? provider.message.slice(0, 1000)
            : `Brevo ${response.status}`;

        if (log?.id) {
          await admin
            .from('email_logs')
            .update({
              status: 'failed',
              error_message: errorMessage,
              failed_at: new Date().toISOString(),
            })
            .eq('id', log.id);
        }
      } else {
        notificationSent = true;

        if (log?.id) {
          await admin
            .from('email_logs')
            .update({
              status: 'sent',
              provider_message_id:
                typeof provider.messageId === 'string'
                  ? provider.messageId
                  : null,
              sent_at: new Date().toISOString(),
              error_message: null,
            })
            .eq('id', log.id);
        }
      }
    } catch (error) {
      console.error('Brevo public contact error', error);

      if (log?.id) {
        await admin
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: String(error).slice(0, 1000),
            failed_at: new Date().toISOString(),
          })
          .eq('id', log.id);
      }
    }
  } else {
    console.warn('BREVO_API_KEY absent: public contact saved without email notification');
  }

  return jsonResponse({
    success: true,
    requestId: supportRequest.id,
    notificationSent,
  });
});
