-- Clementplane — Pré-lancement
-- Sécurisation RLS disponibilités + cloisonnement OF
-- IMPORTANT : aucune règle métier n'est modifiée.
--
-- Cette migration :
-- 1) conserve la lecture actuelle des disponibilités ;
-- 2) ferme l'ancienne écriture directe publique sur trainer_availability ;
-- 3) limite l'historique OF aux formateurs rattachés à l'OF ;
-- 4) applique le même cloisonnement aux RPC de notes et d'historique.

-- ============================================================
-- 1. DISPONIBILITÉS : suppression de l'ancienne écriture publique
-- ============================================================

drop policy if exists
  "Public Write (availability)"
on public.trainer_availability;

revoke insert, update, delete
on table public.trainer_availability
from anon, authenticated;


-- ============================================================
-- 2. HISTORIQUE : RLS directe côté OF
-- ============================================================

drop policy if exists
  "Organization members can read availability history"
on public.trainer_availability_history;

create policy
  "Organization members can read availability history"
on public.trainer_availability_history
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_trainers ot
    join public.organization_members om
      on om.organization_id = ot.organization_id
    where ot.trainer_id = trainer_availability_history.trainer_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
  )
);


-- ============================================================
-- 3. NOTES : lecture OF limitée aux formateurs de son réseau
-- Règle métier conservée :
-- - notes du formateur visibles ;
-- - notes internes de l'OF visibles ;
-- - notes internes d'un autre OF invisibles.
-- ============================================================

create or replace function public.get_organization_availability_notes(
  p_organization_id uuid,
  p_trainer_ids uuid[],
  p_start_day date,
  p_end_day date
)
returns table (
  id uuid,
  trainer_id uuid,
  day date,
  content text,
  source text,
  can_edit boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin

  if not public.user_belongs_to_organization(
    p_organization_id
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  return query

  select
    n.id,
    n.trainer_id,
    n.day,
    n.content,
    n.source,

    (
      n.source = 'organization'
      and n.organization_id = p_organization_id
    ) as can_edit,

    n.created_at,
    n.updated_at

  from public.trainer_availability_notes n

  where n.trainer_id = any(p_trainer_ids)

    and exists (
      select 1
      from public.organization_trainers ot
      where ot.organization_id = p_organization_id
        and ot.trainer_id = n.trainer_id
    )

    and n.day >= p_start_day
    and n.day <= p_end_day

    and (
      n.source = 'trainer'
      or (
        n.source = 'organization'
        and n.organization_id = p_organization_id
      )
    )

  order by
    n.day,
    n.created_at;

end;
$$;

revoke all
on function public.get_organization_availability_notes(
  uuid,
  uuid[],
  date,
  date
)
from public;

grant execute
on function public.get_organization_availability_notes(
  uuid,
  uuid[],
  date,
  date
)
to authenticated;


-- ============================================================
-- 4. HISTORIQUE : lecture RPC OF limitée aux formateurs du réseau
-- ============================================================

create or replace function public.get_organization_availability_history(
  p_organization_id uuid,
  p_trainer_ids uuid[],
  p_start_day date,
  p_end_day date
)
returns table (
  id uuid,
  trainer_id uuid,
  day date,
  previous_status text,
  new_status text,
  source text,
  changed_by_user_id uuid,
  actor_name text,
  organization_id uuid,
  organization_name text,
  created_at timestamptz
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

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  return query

  select
    h.id,
    h.trainer_id,
    h.day,
    h.previous_status,
    h.new_status,
    h.source,
    h.changed_by_user_id,

    nullif(
      concat_ws(
        ' ',
        p.first_name,
        p.last_name
      ),
      ''
    ) as actor_name,

    h.organization_id,

    case
      when h.source = 'trainer'
        then null

      when h.organization_id = p_organization_id
        then o.name

      when h.organization_id is not null
        then 'Autre organisme'

      else null
    end as organization_name,

    h.created_at

  from public.trainer_availability_history h

  left join public.profiles p
    on p.id = h.changed_by_user_id

  left join public.organizations o
    on o.id = h.organization_id

  where h.trainer_id = any(p_trainer_ids)

    and exists (
      select 1
      from public.organization_trainers ot
      where ot.organization_id = p_organization_id
        and ot.trainer_id = h.trainer_id
    )

    and h.day >= p_start_day
    and h.day <= p_end_day

  order by
    h.day,
    h.created_at desc;

end;
$$;

revoke all
on function public.get_organization_availability_history(
  uuid,
  uuid[],
  date,
  date
)
from public;

grant execute
on function public.get_organization_availability_history(
  uuid,
  uuid[],
  date,
  date
)
to authenticated;
