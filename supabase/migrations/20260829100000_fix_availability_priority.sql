-- Clementplane — Sprint 20.5
-- La déclaration locale de l'OF prime sur la disponibilité globale
-- du formateur pour l'affichage et le planning de cet OF.
--
-- Si l'OF n'a aucune déclaration locale, on utilise alors
-- la disponibilité globale du formateur.

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
    coalesce(ota.id, ta.id) as id,
    ed.trainer_id,
    ed.day,

    case
      when ota.id is not null
       and coalesce(ota.status, '') <> ''
        then ota.status
      else coalesce(ta.status, '')
    end as status,

    coalesce(ota.status, '') as declared_status,

    case
      when ota.id is not null
       and coalesce(ota.status, '') <> ''
        then ota.updated_at
      else ta.updated_at
    end as updated_at,

    case
      when ota.id is not null
       and coalesce(ota.status, '') <> ''
        then 'organization'
      when ta.id is not null
       and coalesce(ta.status, '') <> ''
        then 'trainer'
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
