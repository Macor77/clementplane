-- Dedicated worker key stays inside Vault. This RPC returns only a boolean.
-- No browser role may invoke it, and no Vault read privilege is granted.
create or replace function public.microsoft_calendar_authorize_worker(p_secret text)
returns boolean language sql stable security definer set search_path='' as $$
 select case when p_secret ~ '^[0-9a-f]{64}$' then
  (select count(*)=1 and coalesce(bool_and(
   pg_catalog.sha256(pg_catalog.convert_to(decrypted_secret,'UTF8')) =
   pg_catalog.sha256(pg_catalog.convert_to(p_secret,'UTF8'))
  ),false) from vault.decrypted_secrets where name='microsoft_calendar_worker_secret')
 else false end;
$$;
revoke all on function public.microsoft_calendar_authorize_worker(text) from public,anon,authenticated;
grant execute on function public.microsoft_calendar_authorize_worker(text) to service_role;
