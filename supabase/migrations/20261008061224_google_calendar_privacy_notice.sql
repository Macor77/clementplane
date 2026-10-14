-- V1.2 beta: accept the Google notice and both cached preceding notices.
-- Record exactly the version acknowledged; do not weaken acknowledgement checks.
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
     or v_privacy_version not in ('2026-08-29', '2026-10-05', '2026-10-08') then
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
