-- ==========================================================
-- SPRINT 10.3 — RÉFÉRENTIEL GLOBAL DU MATÉRIEL
-- ==========================================================

create table if not exists public.equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by_user_id uuid null references auth.users(id) on delete set null
);

create unique index if not exists equipment_catalog_normalized_name_uidx
  on public.equipment_catalog (normalized_name);

alter table public.equipment_catalog enable row level security;

drop policy if exists "Authenticated users can read equipment catalog"
  on public.equipment_catalog;

create policy "Authenticated users can read equipment catalog"
  on public.equipment_catalog
  for select
  to authenticated
  using (is_active = true);

revoke all on table public.equipment_catalog from anon;
revoke all on table public.equipment_catalog from authenticated;
grant select on table public.equipment_catalog to authenticated;

create or replace function public.normalize_equipment_name(p_name text)
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

create or replace function public.add_equipment_to_catalog(p_name text)
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
  cleaned_name text :=
    regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  normalized text;
  existing_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if cleaned_name = '' then
    raise exception 'EQUIPMENT_NAME_REQUIRED';
  end if;

  normalized := public.normalize_equipment_name(cleaned_name);

  select ec.id
  into existing_id
  from public.equipment_catalog ec
  where ec.normalized_name = normalized
  limit 1;

  if existing_id is not null then
    update public.equipment_catalog ec
    set is_active = true
    where ec.id = existing_id;

    return query
    select ec.id, ec.name, ec.normalized_name
    from public.equipment_catalog ec
    where ec.id = existing_id;

    return;
  end if;

  return query
  insert into public.equipment_catalog (
    name,
    normalized_name,
    created_by_user_id
  )
  values (
    cleaned_name,
    normalized,
    current_user_id
  )
  returning
    equipment_catalog.id,
    equipment_catalog.name,
    equipment_catalog.normalized_name;
end;
$$;

revoke all on function public.add_equipment_to_catalog(text) from public;
grant execute on function public.add_equipment_to_catalog(text) to authenticated;

-- ----------------------------------------------------------
-- Nettoyage historique ciblé
-- ----------------------------------------------------------

-- Formateurs : remplace les variantes connues et scinde
-- "Bac feu - Extincteurs" en deux matériels distincts.
update public.trainers t
set materiel = (
  select coalesce(array_agg(distinct cleaned_value order by cleaned_value), '{}'::text[])
  from (
    select case
      when public.normalize_equipment_name(value) in
        ('bac feu', 'bac feu incendie', 'incendie bac feu')
        then 'Bac feu'
      when public.normalize_equipment_name(value) in
        ('vr', 'vr incendie', 'incendie vr')
        then 'VR incendie'
      when public.normalize_equipment_name(value) = 'extincteurs'
        then 'Extincteurs'
      when public.normalize_equipment_name(value) = 'défibrillateur'
        then 'Défibrillateur'
      else btrim(value)
    end as cleaned_value
    from unnest(coalesce(t.materiel, '{}'::text[])) as u(value)
    where public.normalize_equipment_name(value) <> 'bac feu - extincteurs'

    union all

    select 'Bac feu'
    where exists (
      select 1
      from unnest(coalesce(t.materiel, '{}'::text[])) as u(value)
      where public.normalize_equipment_name(value) = 'bac feu - extincteurs'
    )

    union all

    select 'Extincteurs'
    where exists (
      select 1
      from unnest(coalesce(t.materiel, '{}'::text[])) as u(value)
      where public.normalize_equipment_name(value) = 'bac feu - extincteurs'
    )
  ) normalized_values
  where cleaned_value <> ''
);

-- Missions : même normalisation.
update public.missions m
set materiel = (
  select coalesce(array_agg(distinct cleaned_value order by cleaned_value), '{}'::text[])
  from (
    select case
      when public.normalize_equipment_name(value) in
        ('bac feu', 'bac feu incendie', 'incendie bac feu')
        then 'Bac feu'
      when public.normalize_equipment_name(value) in
        ('vr', 'vr incendie', 'incendie vr')
        then 'VR incendie'
      when public.normalize_equipment_name(value) = 'extincteurs'
        then 'Extincteurs'
      when public.normalize_equipment_name(value) = 'défibrillateur'
        then 'Défibrillateur'
      else btrim(value)
    end as cleaned_value
    from unnest(coalesce(m.materiel, '{}'::text[])) as u(value)
    where public.normalize_equipment_name(value) <> 'bac feu - extincteurs'

    union all

    select 'Bac feu'
    where exists (
      select 1
      from unnest(coalesce(m.materiel, '{}'::text[])) as u(value)
      where public.normalize_equipment_name(value) = 'bac feu - extincteurs'
    )

    union all

    select 'Extincteurs'
    where exists (
      select 1
      from unnest(coalesce(m.materiel, '{}'::text[])) as u(value)
      where public.normalize_equipment_name(value) = 'bac feu - extincteurs'
    )
  ) normalized_values
  where cleaned_value <> ''
);

-- Catalogue : valeurs canoniques + toutes les autres valeurs historiques
-- réellement présentes dans les colonnes "materiel".
insert into public.equipment_catalog (name, normalized_name)
values
  ('Bac feu', public.normalize_equipment_name('Bac feu')),
  ('Extincteurs', public.normalize_equipment_name('Extincteurs')),
  ('Défibrillateur', public.normalize_equipment_name('Défibrillateur')),
  ('VR incendie', public.normalize_equipment_name('VR incendie'))
on conflict (normalized_name) do nothing;

with historical as (
  select btrim(value) as name
  from public.trainers t
  cross join lateral unnest(coalesce(t.materiel, '{}'::text[])) as value
  where btrim(value) <> ''

  union all

  select btrim(value) as name
  from public.missions m
  cross join lateral unnest(coalesce(m.materiel, '{}'::text[])) as value
  where btrim(value) <> ''
),
deduplicated as (
  select distinct on (public.normalize_equipment_name(name))
    name,
    public.normalize_equipment_name(name) as normalized_name
  from historical
  order by public.normalize_equipment_name(name), name
)
insert into public.equipment_catalog (name, normalized_name)
select d.name, d.normalized_name
from deduplicated d
on conflict (normalized_name) do nothing;
