-- ============================================================
-- TimeForma
-- Lecture sécurisée de l'historique des disponibilités
-- ============================================================


-- ============================================================
-- 1. HISTORIQUE DU FORMATEUR CONNECTÉ
-- ============================================================

create or replace function public.get_my_availability_history(
  p_start_day date,
  p_end_day date
)
returns table (
  id uuid,
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
language sql
stable
security definer
set search_path = public
as $$
  select
    h.id,
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

    o.name as organization_name,

    h.created_at

  from public.trainer_availability_history h

  join public.trainers t
    on t.id = h.trainer_id

  left join public.profiles p
    on p.id = h.changed_by_user_id

  left join public.organizations o
    on o.id = h.organization_id

  where t.user_id = auth.uid()

    and h.day >= p_start_day
    and h.day <= p_end_day

  order by
    h.day,
    h.created_at desc;
$$;


revoke all
on function public.get_my_availability_history(date, date)
from public;

grant execute
on function public.get_my_availability_history(date, date)
to authenticated;



-- ============================================================
-- 2. HISTORIQUE VISIBLE PAR UN OF
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