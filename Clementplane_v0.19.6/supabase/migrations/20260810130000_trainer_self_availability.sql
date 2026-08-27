-- ==========================================================
-- MINI SPRINT 8.3
-- Disponibilités personnelles du formateur
-- ==========================================================


-- ----------------------------------------------------------
-- 1. Lire uniquement MES disponibilités
-- ----------------------------------------------------------

create or replace function public.get_my_trainer_availability(
  p_start_day date,
  p_end_day date
)
returns table (
  day date,
  status text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ta.day,
    coalesce(ta.status, ''),
    ta.updated_at
  from public.trainer_availability ta
  join public.trainers t
    on t.id = ta.trainer_id
  where t.user_id = auth.uid()
    and ta.day >= p_start_day
    and ta.day <= p_end_day
  order by ta.day;
$$;

revoke all
on function public.get_my_trainer_availability(date, date)
from public;

grant execute
on function public.get_my_trainer_availability(date, date)
to authenticated;


-- ----------------------------------------------------------
-- 2. Modifier uniquement MA disponibilité
--
-- États volontairement autorisés :
--   ''        = non renseigné
--   dispo     = disponible
--   indispo   = indisponible
--
-- "mission" et "option" sont calculés automatiquement
-- depuis les missions et ne peuvent jamais être saisis ici.
-- ----------------------------------------------------------

create or replace function public.set_my_trainer_availability(
  p_day date,
  p_status text
)
returns table (
  day date,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_trainer_id uuid;
  clean_status text := coalesce(p_status, '');
begin

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_day is null then
    raise exception 'DAY_REQUIRED';
  end if;

  if clean_status not in ('', 'dispo', 'indispo') then
    raise exception 'INVALID_AVAILABILITY_STATUS';
  end if;

  select t.id
  into current_trainer_id
  from public.trainers t
  where t.user_id = auth.uid()
  limit 1;

  if current_trainer_id is null then
    raise exception 'TRAINER_PROFILE_NOT_FOUND';
  end if;

  insert into public.trainer_availability (
    trainer_id,
    day,
    status,
    updated_at
  )
  values (
    current_trainer_id,
    p_day,
    clean_status,
    now()
  )
  on conflict (trainer_id, day)
  do update set
    status = excluded.status,
    updated_at = now();

  return query
  select
    ta.day,
    coalesce(ta.status, ''),
    ta.updated_at
  from public.trainer_availability ta
  where ta.trainer_id = current_trainer_id
    and ta.day = p_day
  limit 1;

end;
$$;

revoke all
on function public.set_my_trainer_availability(date, text)
from public;

grant execute
on function public.set_my_trainer_availability(date, text)
to authenticated;


-- ----------------------------------------------------------
-- 3. Lire MES engagements de mission
--
-- On ne révèle volontairement :
-- - ni le client
-- - ni l'organisme
-- - ni le tarif
-- - ni les commentaires
--
-- Seulement :
-- option / mission + journée.
-- ----------------------------------------------------------

create or replace function public.get_my_trainer_commitments(
  p_start_day date,
  p_end_day date
)
returns table (
  day date,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    md.date as day,

    case
      when bool_or(mf.statut = 'affecte')
        then 'mission'
      else 'option'
    end as status

  from public.mission_formateurs mf

  join public.trainers t
    on t.id = mf.formateur_id

  join public.mission_dates md
    on md.mission_id = mf.mission_id

  where t.user_id = auth.uid()

    and mf.statut in (
      'accepte',
      'affecte'
    )

    and md.date >= p_start_day
    and md.date <= p_end_day

  group by md.date

  order by md.date;
$$;

revoke all
on function public.get_my_trainer_commitments(date, date)
from public;

grant execute
on function public.get_my_trainer_commitments(date, date)
to authenticated;