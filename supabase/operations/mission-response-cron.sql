-- Apply only after the outbox and compatible Edge worker have been deployed.
-- Reuse the existing project-local worker credential; never print its value.
-- net must remain excluded from PostgREST and client roles must be NOLOGIN.
do $$begin
 if exists(select 1 from pg_roles where rolname in ('anon','authenticated','service_role') and rolcanlogin) then raise exception 'Client roles must be NOLOGIN';end if;
 if (select count(*) from vault.secrets where name in ('calendar_worker_url','calendar_worker_secret'))<>2 then raise exception 'Worker Vault configuration missing';end if;
 if exists(select 1 from cron.job where jobname='clementplane-mission-responses') then raise exception 'Scheduler already exists: inspect instead of duplicating';end if;
end$$;
select cron.schedule('clementplane-mission-responses','* * * * *',$cron$
 select net.http_post(
  url:=regexp_replace((select decrypted_secret from vault.decrypted_secrets where name='calendar_worker_url'),'/google-calendar-worker$','/notify-mission-response'),
  headers:=jsonb_build_object('Content-Type','application/json','X-Calendar-Worker-Secret',(select decrypted_secret from vault.decrypted_secrets where name='calendar_worker_secret')),
  body:='{}'::jsonb,timeout_milliseconds:=55000
 );
$cron$);
-- Pause: select cron.unschedule('clementplane-mission-responses');
