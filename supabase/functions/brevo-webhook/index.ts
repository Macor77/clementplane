import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const eventDate = (payload: Record<string, unknown>) => {
  const ms = Number(payload.ts_epoch || 0);
  if (Number.isFinite(ms) && ms > 0) return new Date(ms).toISOString();
  const seconds = Number(payload.ts_event || payload.ts || 0);
  if (Number.isFinite(seconds) && seconds > 0) return new Date(seconds * 1000).toISOString();
  return new Date().toISOString();
};

const extractLogId = (payload: Record<string, unknown>) => {
  const custom = String(payload['X-Mailin-custom'] || '');
  const match = custom.match(/formaplane_log_id:([0-9a-f-]{36})/i);
  return match?.[1] || null;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);

  const expectedSecret = Deno.env.get('BREVO_WEBHOOK_SECRET') || '';
  const suppliedSecret = new URL(req.url).searchParams.get('secret') || '';
  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return json({ ok: false, message: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return json({ ok: false }, 500);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, message: 'Invalid JSON' }, 400);
  }

  const rawEvent = String(payload.event || '').trim().toLowerCase();
  const eventAliases: Record<string, string> = {
    unique_opened: 'opened',
    uniqueopened: 'opened',
    first_opening: 'opened',
    first_open: 'opened',
    opened: 'opened',
    click: 'click',
    clicked: 'click',
  };
  const event = eventAliases[rawEvent] || rawEvent;
  const providerMessageId = String(payload['message-id'] || '').trim();
  const logIdFromHeader = extractLogId(payload);
  const occurredAt = eventDate(payload);

  let log: any = null;
  if (logIdFromHeader) {
    const { data } = await admin.from('email_logs').select('*').eq('id', logIdFromHeader).maybeSingle();
    log = data;
  }
  if (!log && providerMessageId) {
    const { data } = await admin.from('email_logs').select('*').eq('provider_message_id', providerMessageId).maybeSingle();
    log = data;
  }
  if (!log) return json({ ok: true, ignored: true });

  const statusByEvent: Record<string, string> = {
    delivered: 'delivered',
    soft_bounce: 'soft_bounce',
    hard_bounce: 'hard_bounce',
    blocked: 'blocked',
    invalid: 'invalid',
    deferred: 'deferred',
    error: 'failed',
  };

  const nextStatus = statusByEvent[event];
  const update: Record<string, unknown> = {
    last_provider_event: event,
    last_provider_event_at: occurredAt,
    metadata: {
      ...(log.metadata || {}),
      last_brevo_event: event,
      last_brevo_event_at: occurredAt,
      last_brevo_reason: payload.reason || null,
    },
  };

  if (nextStatus) update.status = nextStatus;
  if (event === 'delivered' && !log.delivered_at) update.delivered_at = occurredAt;
  if (event === 'opened' && !log.opened_at) update.opened_at = occurredAt;
  if (event === 'click' && !log.clicked_at) update.clicked_at = occurredAt;
  if (['soft_bounce', 'hard_bounce', 'blocked', 'invalid', 'error'].includes(event)) {
    update.error_message = String(payload.reason || event).slice(0, 1000);
    update.failed_at = occurredAt;
  }

  await admin.from('email_logs').update(update).eq('id', log.id);

  if (
    log.related_entity_type === 'mission_formateur' &&
    log.related_entity_id &&
    ['delivered', 'opened', 'click', 'soft_bounce', 'hard_bounce', 'blocked', 'invalid', 'error'].includes(event)
  ) {
    const { data: mf } = await admin
      .from('mission_formateurs')
      .select('id, mission_id, formateur_id, statut')
      .eq('id', log.related_entity_id)
      .maybeSingle();

    if (mf) {
      const actionByEvent: Record<string, string> = {
        delivered: 'email_delivered',
        opened: 'email_opened',
        click: 'email_clicked',
      };
      const action = actionByEvent[event] || 'email_delivery_failed';
      const { data: existing } = await admin
        .from('mission_trainer_history')
        .select('id')
        .eq('mission_formateur_id', mf.id)
        .eq('action', action)
        .contains('details', { email_log_id: log.id, brevo_event: event })
        .limit(1);

      if (!existing?.length) {
        await admin.from('mission_trainer_history').insert({
          mission_id: mf.mission_id,
          trainer_id: mf.formateur_id,
          mission_formateur_id: mf.id,
          action,
          previous_status: mf.statut,
          new_status: mf.statut,
          actor_type: 'system',
          actor_display_name: 'Formaplane',
          details: {
            email_log_id: log.id,
            brevo_event: event,
            recipient_email: log.recipient_email,
            reason: payload.reason || null,
          },
          created_at: occurredAt,
        });
      }
    }
  }

  return json({ ok: true });
});
