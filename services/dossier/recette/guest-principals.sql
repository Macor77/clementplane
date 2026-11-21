-- Minimal synthetic identity tables for the isolated guest_trial database.
-- The guest API uses real invite verification. There is no owner login service.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
create table auth.sessions(id uuid, user_id uuid, not_after timestamptz);
create table public.trainers(id uuid primary key, user_id uuid, prenom text, nom text);
create table public.organizations(id uuid primary key, name text, status text);
create table public.organization_members(user_id uuid, organization_id uuid, status text, role text);
create table public.trainer_availability_contacts(trainer_id uuid, organization_id uuid, email text);
create table public.organization_trainers(trainer_id uuid, organization_id uuid);
create table public.platform_admins(user_id uuid);
insert into auth.users values('00000000-0000-4000-a000-000000000001', 'fixture@example.invalid', now());
insert into public.trainers
select id, id, 'Recette', 'Clementplane' from auth.users;
