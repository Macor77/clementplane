-- ==========================================================
-- SPRINT 10.2 — RÉFÉRENTIEL GLOBAL DES COMPÉTENCES
-- ==========================================================

create table if not exists public.competency_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by_user_id uuid null references auth.users(id) on delete set null
);

create unique index if not exists competency_catalog_normalized_name_uidx
  on public.competency_catalog (normalized_name);

alter table public.competency_catalog enable row level security;

drop policy if exists "Authenticated users can read competency catalog"
  on public.competency_catalog;

create policy "Authenticated users can read competency catalog"
  on public.competency_catalog
  for select
  to authenticated
  using (is_active = true);

revoke all on table public.competency_catalog from anon;
revoke all on table public.competency_catalog from authenticated;
grant select on table public.competency_catalog to authenticated;

create or replace function public.normalize_competency_name(p_name text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(
    regexp_replace(
      btrim(coalesce(p_name, '')),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.add_competency_to_catalog(p_name text)
returns table (
  id uuid,
  name text,
  normalized_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  normalized text;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if cleaned_name = '' then
    raise exception 'COMPETENCY_NAME_REQUIRED';
  end if;

  normalized := public.normalize_competency_name(cleaned_name);

  insert into public.competency_catalog (
    name,
    normalized_name,
    created_by_user_id
  )
  values (
    cleaned_name,
    normalized,
    current_user_id
  )
  on conflict (normalized_name)
  do update set
    is_active = true
  returning
    competency_catalog.id,
    competency_catalog.name,
    competency_catalog.normalized_name
  into id, name, normalized_name;

  return next;
end;
$$;

revoke all on function public.add_competency_to_catalog(text) from public;
grant execute on function public.add_competency_to_catalog(text) to authenticated;

-- Valeurs canoniques connues.
insert into public.competency_catalog (name, normalized_name)
values
  ('SST', public.normalize_competency_name('SST')),
  ('Incendie', public.normalize_competency_name('Incendie'))
on conflict (normalized_name) do nothing;

-- Import des compétences historiques encore absentes du catalogue.
-- On conserve leur libellé existant ; les doublons de casse/espaces sont fusionnés.
with historical as (
  select btrim(value) as name
  from public.trainers t
  cross join lateral unnest(coalesce(t.competences, '{}'::text[])) as value
  where btrim(value) <> ''

  union all

  select btrim(value) as name
  from public.missions m
  cross join lateral unnest(coalesce(m.competences, '{}'::text[])) as value
  where btrim(value) <> ''
),
deduplicated as (
  select distinct on (public.normalize_competency_name(name))
    name,
    public.normalize_competency_name(name) as normalized_name
  from historical
  order by
    public.normalize_competency_name(name),
    name
)
insert into public.competency_catalog (name, normalized_name)
select d.name, d.normalized_name
from deduplicated d
on conflict (normalized_name) do nothing;
