-- MANUAL gate: run only on the designated STAGING project first.
-- Provision Vault secrets calendar_worker_url (full HTTPS Edge endpoint),
-- calendar_worker_secret (same value as Edge secret CALENDAR_WORKER_SECRET).
-- Do not paste values in commits, chat, CLI history or SQL logs.
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$begin
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
-- pg_net queues contain this service-to-service header: retain restricted default
-- access; never dump request queue contents into logs/support bundles.
