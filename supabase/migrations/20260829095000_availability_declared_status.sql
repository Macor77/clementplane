-- Clementplane — Sprint 20.5
-- Sépare l'état effectif de la déclaration locale de l'OF.

drop function if exists public.get_organization_trainer_availability(
  uuid, uuid[], date, date
);

create function public.get_organization_trainer_availability(
  p_organization_id uuid,
  p_trainer_ids uuid[],
  p_start_day date,
  p_end_day date
)
returns table (
  id uuid,
  trainer_id uuid,
  day date,
  status text,
  declared_status text,
  updated_at timestamptz,
  source text
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

  if p_organization_id is null
     or not public.is_organization_member(p_organization_id) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  return query
  with effective_days as (
    select
      ta.trainer_id,
      ta.day
    from public.trainer_availability ta
    where ta.trainer_id = any(p_trainer_ids)
      and ta.day >= p_start_day
      and ta.day <= p_end_day

    union

    select
      ota.trainer_id,
      ota.day
    from public.organization_trainer_availability ota
    where ota.organization_id = p_organization_id
      and ota.trainer_id = any(p_trainer_ids)
      and ota.day >= p_start_day
      and ota.day <= p_end_day
  )
  select
    coalesce(ta.id, ota.id) as id,
    ed.trainer_id,
    ed.day,

    case
      when ta.id is not null
       and coalesce(ta.status, '') <> ''
        then ta.status
      else coalesce(ota.status, '')
    end as status,

    coalesce(ota.status, '') as declared_status,

    case
      when ta.id is not null
       and coalesce(ta.status, '') <> ''
        then ta.updated_at
      else coalesce(ota.updated_at, ta.updated_at)
    end as updated_at,

    case
      when ta.id is not null
       and coalesce(ta.status, '') <> ''
        then 'trainer'
      when ota.id is not null
        then 'organization'
      else 'none'
    end as source

  from effective_days ed

  left join public.trainer_availability ta
    on ta.trainer_id = ed.trainer_id
   and ta.day = ed.day

  left join public.organization_trainer_availability ota
    on ota.organization_id = p_organization_id
   and ota.trainer_id = ed.trainer_id
   and ota.day = ed.day

  order by ed.day, ed.trainer_id;
end;
$$;

revoke all on function public.get_organization_trainer_availability(
  uuid, uuid[], date, date
) from public;

grant execute on function public.get_organization_trainer_availability(
  uuid, uuid[], date, date
) to authenticated;
