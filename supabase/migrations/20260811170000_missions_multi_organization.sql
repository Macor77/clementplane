-- ============================================================
-- TimeForma
-- Cloisonnement multi-OF des missions
-- ============================================================
--
-- Les missions historiques appartiennent à Alter Prévention :
-- dc1edfbd-79f6-426b-9842-dc23c7eb562f
--
-- Objectifs :
-- - chaque mission appartient à un seul organisme ;
-- - un OF ne peut lire/modifier/supprimer que ses missions ;
-- - mission_dates et mission_formateurs héritent du même cloisonnement ;
-- - les contrôles de disponibilité continuent à détecter les
--   engagements d'un formateur auprès d'autres OF SANS révéler
--   le détail des missions concernées.
-- ============================================================


-- ============================================================
-- 1. PROPRIÉTAIRE DE LA MISSION
-- ============================================================

alter table public.missions
add column if not exists organization_id uuid;


update public.missions
set organization_id =
  'dc1edfbd-79f6-426b-9842-dc23c7eb562f'::uuid
where organization_id is null;


do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname =
      'missions_organization_id_fkey'
      and conrelid =
        'public.missions'::regclass
  ) then
    alter table public.missions
    add constraint
      missions_organization_id_fkey
    foreign key (
      organization_id
    )
    references public.organizations(id)
    on delete restrict;
  end if;
end;
$$;


alter table public.missions
alter column organization_id
set not null;


create index if not exists
  missions_organization_id_idx
on public.missions (
  organization_id
);


-- ============================================================
-- 2. RLS : MISSIONS
-- ============================================================

alter table public.missions
enable row level security;


drop policy if exists
  missions_select_public
on public.missions;

drop policy if exists
  missions_insert_public
on public.missions;

drop policy if exists
  missions_update_public
on public.missions;

drop policy if exists
  missions_delete_public
on public.missions;


drop policy if exists
  "Organization members can read missions"
on public.missions;

create policy
  "Organization members can read missions"
on public.missions
for select
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
);


drop policy if exists
  "Organization members can create missions"
on public.missions;

create policy
  "Organization members can create missions"
on public.missions
for insert
to authenticated
with check (
  public.is_organization_member(
    organization_id
  )
);


drop policy if exists
  "Organization members can update missions"
on public.missions;

create policy
  "Organization members can update missions"
on public.missions
for update
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
)
with check (
  public.is_organization_member(
    organization_id
  )
);


drop policy if exists
  "Organization members can delete missions"
on public.missions;

create policy
  "Organization members can delete missions"
on public.missions
for delete
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
);


-- ============================================================
-- 3. RLS : MISSION_DATES
-- ============================================================

alter table public.mission_dates
enable row level security;


drop policy if exists
  mission_dates_select_public
on public.mission_dates;

drop policy if exists
  mission_dates_insert_public
on public.mission_dates;

drop policy if exists
  mission_dates_update_public
on public.mission_dates;

drop policy if exists
  mission_dates_delete_public
on public.mission_dates;


drop policy if exists
  "Organization members can read mission dates"
on public.mission_dates;

create policy
  "Organization members can read mission dates"
on public.mission_dates
for select
to authenticated
using (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_dates.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
);


drop policy if exists
  "Organization members can create mission dates"
on public.mission_dates;

create policy
  "Organization members can create mission dates"
on public.mission_dates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_dates.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
);


drop policy if exists
  "Organization members can update mission dates"
on public.mission_dates;

create policy
  "Organization members can update mission dates"
on public.mission_dates
for update
to authenticated
using (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_dates.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
)
with check (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_dates.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
);


drop policy if exists
  "Organization members can delete mission dates"
on public.mission_dates;

create policy
  "Organization members can delete mission dates"
on public.mission_dates
for delete
to authenticated
using (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_dates.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
);


-- ============================================================
-- 4. RLS : MISSION_FORMATEURS
-- ============================================================

alter table public.mission_formateurs
enable row level security;


drop policy if exists
  mission_formateurs_select_public
on public.mission_formateurs;

drop policy if exists
  mission_formateurs_insert_public
on public.mission_formateurs;

drop policy if exists
  mission_formateurs_update_public
on public.mission_formateurs;

drop policy if exists
  mission_formateurs_delete_public
on public.mission_formateurs;


drop policy if exists
  "Organization members can read mission trainers"
on public.mission_formateurs;

create policy
  "Organization members can read mission trainers"
on public.mission_formateurs
for select
to authenticated
using (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_formateurs.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
);


drop policy if exists
  "Organization members can create mission trainers"
on public.mission_formateurs;

create policy
  "Organization members can create mission trainers"
on public.mission_formateurs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_formateurs.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
);


drop policy if exists
  "Organization members can update mission trainers"
on public.mission_formateurs;

create policy
  "Organization members can update mission trainers"
on public.mission_formateurs
for update
to authenticated
using (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_formateurs.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
)
with check (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_formateurs.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
);


drop policy if exists
  "Organization members can delete mission trainers"
on public.mission_formateurs;

create policy
  "Organization members can delete mission trainers"
on public.mission_formateurs
for delete
to authenticated
using (
  exists (
    select 1
    from public.missions m
    where m.id =
      mission_formateurs.mission_id
      and public.is_organization_member(
        m.organization_id
      )
  )
);


-- ============================================================
-- 5. DISPONIBILITÉ GLOBALE SANS FUITE DE DONNÉES
-- ============================================================

create or replace function
public.get_trainer_mission_commitments_safe(
  p_trainer_ids uuid[],
  p_start_day date,
  p_end_day date,
  p_exclude_mission_id uuid default null
)
returns table (
  mission_id uuid,
  formateur_id uuid,
  statut text,
  dates date[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  return query
  select
    mf.mission_id,
    mf.formateur_id,
    mf.statut,
    array_agg(
      md.date
      order by md.date
    ) as dates
  from public.mission_formateurs mf
  join public.mission_dates md
    on md.mission_id =
      mf.mission_id
  where
    mf.formateur_id =
      any(p_trainer_ids)
    and mf.statut in (
      'accepte',
      'affecte'
    )
    and md.date >=
      p_start_day
    and md.date <=
      p_end_day
    and (
      p_exclude_mission_id is null
      or mf.mission_id <>
        p_exclude_mission_id
    )
  group by
    mf.mission_id,
    mf.formateur_id,
    mf.statut;
end;
$$;


revoke all
on function
public.get_trainer_mission_commitments_safe(
  uuid[],
  date,
  date,
  uuid
)
from public;

grant execute
on function
public.get_trainer_mission_commitments_safe(
  uuid[],
  date,
  date,
  uuid
)
to authenticated;


-- ============================================================
-- 6. CONTRÔLE ANTI DOUBLE-AFFECTATION MULTI-OF
-- ============================================================

create or replace function
public.trainer_has_affected_conflict(
  p_mission_id uuid,
  p_trainer_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  return exists (
    select 1
    from public.mission_formateurs mf
    join public.mission_dates other_date
      on other_date.mission_id =
        mf.mission_id
    join public.mission_dates current_mission_date
      on current_mission_date.mission_id =
        p_mission_id
      and current_mission_date.date =
        other_date.date
    where
      mf.formateur_id =
        p_trainer_id
      and mf.statut =
        'affecte'
      and mf.mission_id <>
        p_mission_id
  );
end;
$$;


revoke all
on function
public.trainer_has_affected_conflict(
  uuid,
  uuid
)
from public;

grant execute
on function
public.trainer_has_affected_conflict(
  uuid,
  uuid
)
to authenticated;


-- ============================================================
-- 7. RÉCONCILIATION DES OPTIONS APRÈS UNE AFFECTATION
-- ============================================================

create or replace function
public.reconcile_trainer_conflicts_safe(
  p_trainer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_has_conflict boolean;
  v_expected_status text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  for v_row in
    select
      mf.id,
      mf.mission_id,
      mf.statut
    from public.mission_formateurs mf
    where
      mf.formateur_id =
        p_trainer_id
      and mf.statut in (
        'accepte',
        'indisponible_affecte_ailleurs'
      )
  loop

    select exists (
      select 1
      from public.mission_formateurs affected
      join public.mission_dates affected_date
        on affected_date.mission_id =
          affected.mission_id
      join public.mission_dates option_date
        on option_date.mission_id =
          v_row.mission_id
        and option_date.date =
          affected_date.date
      where
        affected.formateur_id =
          p_trainer_id
        and affected.statut =
          'affecte'
        and affected.mission_id <>
          v_row.mission_id
    )
    into v_has_conflict;


    v_expected_status :=
      case
        when v_has_conflict
          then 'indisponible_affecte_ailleurs'
        else 'accepte'
      end;


    if v_row.statut <>
       v_expected_status then

      update public.mission_formateurs
      set
        statut =
          v_expected_status,
        affecte_le =
          null
      where id =
        v_row.id;

    end if;

  end loop;
end;
$$;


revoke all
on function
public.reconcile_trainer_conflicts_safe(
  uuid
)
from public;

grant execute
on function
public.reconcile_trainer_conflicts_safe(
  uuid
)
to authenticated;