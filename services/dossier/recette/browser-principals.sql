-- Synthetic app profiles. GoTrue creates its own auth tables on startup.
create role supabase_auth_admin login password 'fixture-auth';
create schema auth authorization supabase_auth_admin;
alter role supabase_auth_admin set search_path=auth,public;
grant create on database postgres to supabase_auth_admin;
create role anon;
create role authenticated;
create role service_role;
create role fixture_rest login noinherit password 'fixture-rest';
grant authenticated, anon to fixture_rest;

create table public.profiles(id uuid primary key, first_name text, last_name text);
create table public.trainers(id uuid primary key, user_id uuid, prenom text, nom text,
    email text, telephone text, ville text, code_postal text, statut text);
create table public.organizations(id uuid primary key, name text, status text,
    legal_name text, slug text, logo_url text);
create table public.organization_members(id uuid primary key, user_id uuid, organization_id uuid references public.organizations,
    status text, role text, joined_at timestamptz default now());
create table public.organization_trainers(trainer_id uuid, organization_id uuid);
create table public.trainer_availability_contacts(trainer_id uuid, organization_id uuid, email text);
create table public.platform_admins(user_id uuid);
create function public.fixture_user_id() returns uuid language sql stable as
$$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
alter table profiles enable row level security;
alter table trainers enable row level security;
alter table organization_members enable row level security;
alter table organizations enable row level security;
alter table platform_admins enable row level security;
create policy self on profiles for select to authenticated using(id=fixture_user_id());
create policy self on trainers for select to authenticated using(user_id=fixture_user_id());
create policy self on organization_members for select to authenticated using(user_id=fixture_user_id());
create policy linked on organizations for select to authenticated using(exists(
    select 1 from organization_members m where m.organization_id=organizations.id and m.user_id=fixture_user_id() and m.status='active'));
create policy self on platform_admins for select to authenticated using(user_id=fixture_user_id());
grant select on profiles,trainers,organization_members,organizations,platform_admins to authenticated;

-- The organization's login flow checks for unclaimed profiles with its verified email.
create function public.get_my_trainer_claim_candidates() returns setof public.trainers
language sql stable as $$
    select * from trainers where user_id is null and email =
       (current_setting('request.jwt.claims',true)::jsonb->>'email')
$$;
grant execute on function public.get_my_trainer_claim_candidates() to authenticated;
