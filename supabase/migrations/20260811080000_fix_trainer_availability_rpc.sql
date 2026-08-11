-- ==========================================================
-- MINI SPRINT 8.3
-- Correction RPC disponibilités Formateur
--
-- Correction erreur PostgreSQL 42702 :
-- "column reference day is ambiguous"
-- ==========================================================

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

  on conflict
  on constraint trainer_availability_trainer_day_unique

  do update set
    status = excluded.status,
    updated_at = now();

  return query

  select
    ta.day,
    coalesce(ta.status, ''),
    ta.updated_at

  from public.trainer_availability ta

  where
    ta.trainer_id = current_trainer_id
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