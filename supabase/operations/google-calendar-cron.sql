-- MANUAL gate: run only on the designated STAGING project first.
-- Provision Vault secrets calendar_worker_url (full HTTPS Edge endpoint),
-- calendar_worker_secret (same value as Edge secret CALENDAR_WORKER_SECRET).
-- Do not paste values in commits, chat, CLI history or SQL logs.
-- REQUIRED before scheduling: verify Data API rejects Accept-Profile: net
-- with PGRST106; inspect LOGIN roles and any RPC exposing the net tables.
-- Hosted Supabase grants PUBLIC access to pg_net tables; these platform-owned
-- grants cannot be revoked by postgres. Keep net outside the exposed API
-- schemas and restrict direct database credentials to trusted operators.
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$begin
 if exists(select 1 from pg_roles where rolname in ('anon','authenticated','service_role') and rolcanlogin) then
  raise exception 'Client database roles must remain NOLOGIN';
 end if;
 if (select count(*) from vault.decrypted_secrets where name in ('calendar_worker_url','calendar_worker_secret'))<>2 then
  raise exception 'Configure the two calendar worker Vault secrets first';
 end if;
 if exists(select 1 from cron.job where jobname='clementplane-google-calendar') then
  raise exception 'Scheduler already exists: inspect it rather than creating a duplicate';
 end if;
end$$;
select cron.schedule('clementplane-google-calendar','* * * * *',$cron$
 select net.http_post(
  url:=(select decrypted_secret from vault.decrypted_secrets where name='calendar_worker_url'),
  headers:=jsonb_build_object('Content-Type','application/json','X-Calendar-Worker-Secret',
   (select decrypted_secret from vault.decrypted_secrets where name='calendar_worker_secret')),
  body:='{}'::jsonb,timeout_milliseconds:=55000
 );
$cron$);
-- Pause (not automatically run): select cron.unschedule('clementplane-google-calendar');
-- pg_net queues temporarily contain this service-to-service header. Every
-- direct database LOGIN can potentially read it through PUBLIC grants.
-- Never expose net through the Data API or dump queues into support logs.
