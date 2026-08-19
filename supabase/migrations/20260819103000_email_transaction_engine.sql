-- ==========================================================
-- SPRINT 11.2
-- Moteur transactionnel centralisé - journal des e-mails
-- ==========================================================

create extension if not exists pgcrypto;

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),

  email_type text not null,
  provider text not null default 'brevo',

  recipient_email text not null,
  recipient_user_id uuid references auth.users(id) on delete set null,

  requested_by_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,

  related_entity_type text,
  related_entity_id uuid,

  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),

  provider_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,

  constraint email_logs_recipient_email_not_blank
    check (btrim(recipient_email) <> ''),

  constraint email_logs_email_type_not_blank
    check (btrim(email_type) <> '')
);

create index if not exists email_logs_created_at_idx
  on public.email_logs(created_at desc);

create index if not exists email_logs_requested_by_user_id_idx
  on public.email_logs(requested_by_user_id);

create index if not exists email_logs_recipient_user_id_idx
  on public.email_logs(recipient_user_id);

create index if not exists email_logs_organization_id_idx
  on public.email_logs(organization_id);

create index if not exists email_logs_status_idx
  on public.email_logs(status);

create index if not exists email_logs_email_type_idx
  on public.email_logs(email_type);

alter table public.email_logs enable row level security;

-- Aucun accès direct depuis le navigateur pour le moment.
-- Les écritures sont réalisées uniquement par l'Edge Function
-- via la service role Supabase.
revoke all on table public.email_logs from anon;
revoke all on table public.email_logs from authenticated;
