-- ============================================================
-- TimeForma
-- Confidentialité multi-OF : engagements formateur
-- ============================================================
--
-- Règle :
-- - mission de l'OF courant : l'OF peut savoir qu'il s'agit
--   de sa mission / de son option ;
-- - mission affectée d'un autre OF : seul le fait que le
--   formateur est indisponible est exposé ;
-- - option acceptée d'un autre OF : non exposée ;
-- - aucun identifiant de mission externe n'est retourné.
-- ============================================================

create or replace function
public.get_trainer_mission_commitments_safe(
  p_trainer_ids uuid[],
  p_start_day date,
  p_end_day date,
  p_exclude_mission_id uuid default null,
  p_organization_id uuid default null
)
returns table (
  mission_id uuid,
  formateur_id uuid,
  statut text,
  dates date[],
  is_own_organization boolean
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
     or not public.is_organization_member(
       p_organization_id
     ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  return query
  select
    case
      when m.organization_id =
           p_organization_id
        then mf.mission_id
      else null::uuid
    end as mission_id,

    mf.formateur_id,

    mf.statut,

    array_agg(
      md.date
      order by md.date
    ) as dates,

    (
      m.organization_id =
      p_organization_id
    ) as is_own_organization

  from public.mission_formateurs mf

  join public.missions m
    on m.id =
      mf.mission_id

  join public.mission_dates md
    on md.mission_id =
      mf.mission_id

  where
    mf.formateur_id =
      any(p_trainer_ids)

    and md.date >=
      p_start_day

    and md.date <=
      p_end_day

    and (
      p_exclude_mission_id is null
      or mf.mission_id <>
        p_exclude_mission_id
    )

    and (
      (
        m.organization_id =
          p_organization_id

        and mf.statut in (
          'accepte',
          'affecte'
        )
      )

      or

      (
        m.organization_id <>
          p_organization_id

        and mf.statut =
          'affecte'
      )
    )

  group by
    m.organization_id,
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
  uuid,
  uuid
)
from public;


grant execute
on function
public.get_trainer_mission_commitments_safe(
  uuid[],
  date,
  date,
  uuid,
  uuid
)
to authenticated;
