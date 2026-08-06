-- ==========================================================
-- MINI SPRINT 8.1
-- Gestion des utilisateurs, organisations et rôles
-- ==========================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------
-- TYPES
-- ----------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_status') then
    create type public.account_status as enum ('active', 'invited', 'suspended', 'disabled');
  end if;

  if not exists (select 1 from pg_type where typname = 'organization_status') then
    create type public.organization_status as enum ('active', 'suspended', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'organization_role') then
    create type public.organization_role as enum (
      'owner',
      'admin',
      'manager',
      'coordinator',
      'assistant',
      'viewer'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'membership_status') then
    create type public.membership_status as enum ('invited', 'active', 'suspended', 'revoked');
  end if;
end $$;

-- ----------------------------------------------------------
-- PROFILS UTILISATEURS
-- ----------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- ORGANISATIONS
-- ----------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  slug text not null unique,
  siren text,
  siret text,
  address text,
  postal_code text,
  city text,
  country text not null default 'France',
  logo_url text,
  status public.organization_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (btrim(name) <> ''),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ----------------------------------------------------------
-- APPARTENANCES ET RÔLES
-- ----------------------------------------------------------
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'viewer',
  status public.membership_status not null default 'active',
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx
  on public.organization_members(user_id);

create index if not exists organization_members_organization_id_idx
  on public.organization_members(organization_id);

-- ----------------------------------------------------------
-- LIAISON FACULTATIVE COMPTE <-> PROFIL FORMATEUR
-- ----------------------------------------------------------
alter table public.trainers
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists trainers_user_id_unique_idx
  on public.trainers(user_id)
  where user_id is not null;

-- ----------------------------------------------------------
-- UPDATED_AT
-- ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role = any(allowed_roles)
  );
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Création des profils manquants pour les comptes Auth déjà présents.
insert into public.profiles (id, first_name, last_name)
select
  u.id,
  nullif(u.raw_user_meta_data ->> 'first_name', ''),
  nullif(u.raw_user_meta_data ->> 'last_name', '')
from auth.users u
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- RLS
-- ----------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Un utilisateur gère son propre profil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Un membre actif peut consulter son organisation.
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
on public.organizations for select
to authenticated
using (public.is_organization_member(id));

-- Seuls owner et admin peuvent modifier l'organisation.
drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin"
on public.organizations for update
to authenticated
using (public.has_organization_role(id, array['owner', 'admin']::public.organization_role[]))
with check (public.has_organization_role(id, array['owner', 'admin']::public.organization_role[]));

-- Un utilisateur voit ses appartenances. Les administrateurs voient les membres de leur organisation.
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select"
on public.organization_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']::public.organization_role[]
  )
);

-- Owner et admin peuvent gérer les membres, sans pouvoir créer un autre owner.
drop policy if exists "organization_members_insert_admin" on public.organization_members;
create policy "organization_members_insert_admin"
on public.organization_members for insert
to authenticated
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
  and role <> 'owner'
);

drop policy if exists "organization_members_update_admin" on public.organization_members;
create policy "organization_members_update_admin"
on public.organization_members for update
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
  and role <> 'owner'
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
  and role <> 'owner'
);

drop policy if exists "organization_members_delete_admin" on public.organization_members;
create policy "organization_members_delete_admin"
on public.organization_members for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
  and role <> 'owner'
);

-- ----------------------------------------------------------
-- ORGANISATION INITIALE
-- Le rattachement du propriétaire est effectué séparément,
-- après création/identification de son compte Supabase Auth.
-- ----------------------------------------------------------
insert into public.organizations (name, legal_name, slug)
values ('Alter Prévention', 'Alter Prévention', 'alter-prevention')
on conflict (slug) do update
set name = excluded.name,
    legal_name = excluded.legal_name;

-- Si le projet ne contient qu'un seul compte Auth au moment de la migration,
-- il devient automatiquement propriétaire d'Alter Prévention.
do $$
declare
  existing_user_count integer;
  sole_user_id uuid;
  alter_prevention_id uuid;
begin
  select count(*)
  into existing_user_count
  from auth.users;

  if existing_user_count = 1 then
    select id
    into sole_user_id
    from auth.users
    limit 1;
  end if;

  select id into alter_prevention_id
  from public.organizations
  where slug = 'alter-prevention';

  if existing_user_count = 1 then
    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      status,
      joined_at
    )
    values (
      alter_prevention_id,
      sole_user_id,
      'owner',
      'active',
      now()
    )
    on conflict (organization_id, user_id) do update
    set role = 'owner',
        status = 'active',
        joined_at = coalesce(public.organization_members.joined_at, now());
  end if;
end $$;
