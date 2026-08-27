-- ==========================================================
-- MINI SPRINT 8.3
-- Notes personnelles sur les disponibilités du formateur
-- ==========================================================


-- ----------------------------------------------------------
-- 1. Lecture des disponibilités + note
--
-- Le type de retour change : on doit donc recréer
-- proprement la fonction existante.
-- ----------------------------------------------------------

drop function if exists
public.get_my_trainer_availability(date, date);


create function public.get_my_trainer_availability(
  p_start_day date,
  p_end_day date
)
returns table (
  day date,
  status text,
  note text,
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
    coalesce(ta.note, ''),
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
-- 2. Écriture disponibilité + note
--
-- Le formateur peut modifier :
-- - son statut déclaré
-- - sa note
--
-- Il ne peut toujours PAS créer lui-même :
-- - option
-- - mission
-- ----------------------------------------------------------

drop function if exists
public.set_my_trainer_availability(date, text);


create function public.set_my_trainer_availability(
  p_day date,
  p_status text,
  p_note text default ''
)
returns table (
  day date,
  status text,
  note text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_trainer_id uuid;
  clean_status text := coalesce(p_status, '');
  clean_note text := btrim(coalesce(p_note, ''));
begin

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;


  if p_day is null then
    raise exception 'DAY_REQUIRED';
  end if;


  if clean_status not in (
    '',
    'dispo',
    'indispo'
  ) then
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
    note,
    updated_at
  )
  values (
    current_trainer_id,
    p_day,
    clean_status,
    clean_note,
    now()
  )

  on conflict
  on constraint trainer_availability_trainer_day_unique

  do update set
    status = excluded.status,
    note = excluded.note,
    updated_at = now();


  return query

  select
    ta.day,
    coalesce(ta.status, ''),
    coalesce(ta.note, ''),
    ta.updated_at

  from public.trainer_availability ta

  where ta.trainer_id = current_trainer_id
    and ta.day = p_day

  limit 1;

end;
$$;


revoke all
on function public.set_my_trainer_availability(
  date,
  text,
  text
)
from public;


grant execute
on function public.set_my_trainer_availability(
  date,
  text,
  text
)
to authenticated;