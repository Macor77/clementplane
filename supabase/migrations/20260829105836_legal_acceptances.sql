-- Clementplane — preuve versionnée de l'acceptation juridique à l'inscription.
create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('cgu', 'privacy_notice')),
  document_version text not null,
  accepted_at timestamptz not null default now(),
  source text not null default 'signup',
  created_at timestamptz not null default now(),
  unique (user_id, document_type, document_version)
);

alter table public.legal_acceptances enable row level security;
revoke all on table public.legal_acceptances from public, anon, authenticated;

create or replace function public.record_signup_legal_acceptances()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_intent text := coalesce(new.raw_user_meta_data ->> 'signup_intent', '');
  v_terms_version text := coalesce(new.raw_user_meta_data ->> 'terms_version', '');
  v_privacy_version text := coalesce(new.raw_user_meta_data ->> 'privacy_version', '');
begin
  if v_intent not in ('trainer', 'organization') then
    return new;
  end if;

  if coalesce(new.raw_user_meta_data ->> 'terms_accepted', '') <> 'true'
     or v_terms_version <> '2026-08-29' then
    raise exception 'CGU_ACCEPTANCE_REQUIRED';
  end if;

  if coalesce(new.raw_user_meta_data ->> 'privacy_acknowledged', '') <> 'true'
     or v_privacy_version <> '2026-08-29' then
    raise exception 'PRIVACY_NOTICE_ACKNOWLEDGEMENT_REQUIRED';
  end if;

  insert into public.legal_acceptances
    (user_id, document_type, document_version, accepted_at, source)
  values
    (new.id, 'cgu', v_terms_version, now(), 'signup'),
    (new.id, 'privacy_notice', v_privacy_version, now(), 'signup')
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function public.record_signup_legal_acceptances() from public, anon, authenticated, service_role;

drop trigger if exists trg_record_signup_legal_acceptances on auth.users;
create trigger trg_record_signup_legal_acceptances
after insert on auth.users
for each row execute function public.record_signup_legal_acceptances();
