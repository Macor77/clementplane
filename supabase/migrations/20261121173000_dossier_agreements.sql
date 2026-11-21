begin;

create table dossier.agreement_acceptances (
    user_id uuid not null references auth.users(id) on delete cascade,
    document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
    accepted_at timestamptz not null default now(),
    primary key (user_id, document_sha256)
);
alter table dossier.agreement_acceptances enable row level security;
revoke all on dossier.agreement_acceptances from public, anon, authenticated, service_role;
grant select, insert (user_id, document_sha256) on dossier.agreement_acceptances to dossier_runtime;
create policy runtime_reads_receipts on dossier.agreement_acceptances for select to dossier_runtime using (true);
create policy runtime_records_receipts on dossier.agreement_acceptances for insert to dossier_runtime with check (true);

commit;
