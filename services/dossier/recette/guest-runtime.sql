\getenv trial_password DOSSIER_TRIAL_PASSWORD
create role trial_runtime login password :'trial_password';
grant dossier_runtime to trial_runtime;
-- Enforce the operator-approved maximum at enqueue time, including concurrent retries.
alter table dossier.mail add check(kind in ('invite', 'code'));
create unique index trial_one_message_per_kind on dossier.mail(kind);
