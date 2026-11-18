-- Candidate only. The web API cannot access this schema or inherit the runtime role.
begin;
create role dossier_runtime nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
create schema dossier;
revoke all on schema dossier from public, anon, authenticated, service_role;
grant usage on schema dossier to dossier_runtime;

create table dossier.documents (
 id uuid primary key, owner_id uuid not null references auth.users on delete cascade,
 current_version uuid not null, created_at timestamptz not null default now(),
 unique (id,owner_id)
);
create table dossier.versions (
 id uuid primary key, doc_id uuid not null references dossier.documents on delete cascade,
 kind text not null check(kind in ('cv','nda','sirene','rc','urssaf','habilitation','diplome','qualiopi','autre')),
 title text not null check(length(trim(title)) between 1 and 140),
 issued date, expiry date, expiry_mode text not null check(expiry_mode in ('dated','none','unknown')),
 note text not null default '' check(length(note)<=2000),
 mime text not null check(mime in ('application/pdf','image/jpeg','image/png')),
 bytes bytea not null check(octet_length(bytes) between 1 and 5242880),
 created_at timestamptz not null default now(), retired_at timestamptz,
 check ((expiry_mode='dated') = (expiry is not null)), unique(doc_id,id)
);
alter table dossier.documents add foreign key(id,current_version) references dossier.versions(doc_id,id) deferrable initially deferred;
create table dossier.shares (
 id uuid primary key, owner_id uuid not null references auth.users on delete cascade,
 org_id uuid references public.organizations on delete cascade, email text,
 ends date, revoked_at timestamptz, created_at timestamptz not null default now(),
 check ((org_id is null) <> (email is null)), check(email is null or ends is not null),
 unique(id,owner_id)
);
create table dossier.items (
 share_id uuid not null, doc_id uuid not null, owner_id uuid not null,
 primary key(share_id,doc_id),
 foreign key(share_id,owner_id) references dossier.shares(id,owner_id) on delete cascade,
 foreign key(doc_id,owner_id) references dossier.documents(id,owner_id) on delete cascade
);
create index on dossier.items(doc_id);
create index on dossier.shares(owner_id);
create index on dossier.documents(owner_id);
create table dossier.challenges (
 share_id uuid primary key references dossier.shares on delete cascade, nonce uuid not null,
 expires timestamptz not null, attempts int not null default 0
);
create table dossier.sessions (
 digest text primary key, share_id uuid not null references dossier.shares on delete cascade, expires timestamptz not null
);
create table dossier.events (
 id bigint generated always as identity primary key, owner_id uuid not null references auth.users on delete cascade,
 action text not null, share_id uuid, doc_id uuid, at timestamptz not null default now()
);
create table dossier.mail (
 id uuid primary key default gen_random_uuid(), unique_key text not null unique,
 owner_id uuid not null references auth.users on delete cascade,
 share_id uuid references dossier.shares on delete cascade, version_id uuid references dossier.versions on delete cascade,
 kind text not null check(kind in ('invite','code','replacement','reminder')),
 challenge uuid, expiry date, days_before int, state text not null default 'queued',
 attempts int not null default 0, due timestamptz not null default now(), created_at timestamptz not null default now()
);
create table dossier.limits (key text primary key, started timestamptz not null, n int not null);
create view dossier.today_shares as select s.*, case when revoked_at is not null then 'revoked'
 when ends < (now() at time zone 'Europe/Paris')::date then 'expired' else 'active' end as state from dossier.shares s;
-- Only the dedicated service role can query these narrowly projected identity views.
create view dossier.trainer_accounts as select distinct user_id from public.trainers where user_id is not null;
create view dossier.logins as select s.id,s.user_id, exists(select from public.platform_admins a where a.user_id=s.user_id) as platform_admin
 from auth.sessions s where s.not_after is null or s.not_after>now();
create view dossier.accounts as select id,email from auth.users where email_confirmed_at is not null;
create view dossier.managers as select m.user_id,m.organization_id,o.name,m.role::text as role
 from public.organization_members m join public.organizations o on o.id=m.organization_id
 where m.status='active' and o.status='active' and m.role in ('owner','admin','manager');
create view dossier.partners as
 select distinct t.user_id, o.id,o.name from public.trainers t
 join public.organization_trainers r on r.trainer_id=t.id
 join public.organizations o on o.id=r.organization_id and o.status='active'
 union
 select distinct t.user_id,o.id,o.name from public.trainers t
 join public.trainer_availability_contacts c on c.trainer_id=t.id
 left join lateral (select min(m.organization_id::text)::uuid as id from public.organization_members m
 join auth.users u on u.id=m.user_id join public.organizations active_org on active_org.id=m.organization_id
 where m.status='active' and active_org.status='active' and u.email_confirmed_at is not null
 and lower(trim(u.email))=lower(trim(c.email)) having count(distinct m.organization_id)=1) matched on true
 join public.organizations o on o.id=coalesce(c.organization_id,matched.id) and o.status='active';
create view dossier.trainer_labels as select distinct on (user_id) user_id,prenom as first_name,nom as last_name from public.trainers where user_id is not null order by user_id,id;
grant select on all tables in schema dossier to dossier_runtime;
grant insert,update,delete on dossier.documents,dossier.versions,dossier.shares,dossier.items,dossier.challenges,
 dossier.sessions,dossier.events,dossier.mail,dossier.limits to dossier_runtime;
grant usage on all sequences in schema dossier to dossier_runtime;
do $$
declare tbl text;
begin
 foreach tbl in array array['documents','versions','shares','items','challenges','sessions','events','mail','limits'] loop
 execute format('alter table dossier.%I enable row level security',tbl);
 execute format('create policy runtime_only on dossier.%I to dossier_runtime using(true) with check(true)',tbl);
 end loop;
end $$;
commit;
