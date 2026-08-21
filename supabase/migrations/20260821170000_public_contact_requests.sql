-- Sprint 16 — Contact public landing page / alimentation sécurisée du mini-CRM

-- Les demandes publiques ne sont pas liées à un compte Auth.
alter table public.support_requests
  alter column requester_user_id drop not null;

-- Tracer explicitement l'origine de chaque demande.
alter table public.support_requests
  add column if not exists source text not null default 'app';

alter table public.support_requests
  drop constraint if exists support_requests_source_check,
  add constraint support_requests_source_check
    check (source in ('app', 'public'));

-- Le formulaire public peut provenir d'un prospect qui n'est ni OF ni formateur.
alter table public.support_requests
  drop constraint if exists support_requests_audience_check,
  add constraint support_requests_audience_check
    check (audience in ('organization', 'trainer', 'public'));

alter table public.support_requests
  drop constraint if exists support_requests_requester_profile_check,
  add constraint support_requests_requester_profile_check
    check (requester_profile in ('organization', 'trainer', 'both', 'other'));

create index if not exists support_requests_source_created_idx
  on public.support_requests(source, created_at desc);

-- Limitation anti-abus dédiée au formulaire public.
create table if not exists public.public_contact_rate_limits (
  identifier_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint public_contact_rate_limits_hash_not_blank check (btrim(identifier_hash) <> ''),
  constraint public_contact_rate_limits_count_nonnegative check (request_count >= 0)
);

alter table public.public_contact_rate_limits enable row level security;

-- Aucun accès direct depuis le navigateur : seule l'Edge Function avec service role y accède.
revoke all on public.public_contact_rate_limits from anon, authenticated;
revoke insert, update, delete on public.support_requests from anon, authenticated;

-- La politique de lecture existante reste limitée aux demandes du compte connecté.
drop policy if exists "support_requests_select_own" on public.support_requests;
create policy "support_requests_select_own"
on public.support_requests for select
to authenticated
using (
  requester_user_id is not null
  and requester_user_id = auth.uid()
);
