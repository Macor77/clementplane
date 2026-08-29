-- Sprint 20.5 — correction du conflit PL/pgSQL dans la RPC
-- set_organization_trainer_availability.
--
-- La fonction retourne une table contenant trainer_id.
-- Dans le ON CONFLICT (organization_id, trainer_id, day),
-- PostgreSQL pouvait alors considérer trainer_id comme une
-- variable de sortie PL/pgSQL au lieu de la colonne.
--
-- On cible explicitement la contrainte UNIQUE pour supprimer
-- toute ambiguïté.

create or replace function public.set_organization_trainer_availability(
  p_organization_id uuid,
  p_trainer_id uuid,
  p_day date,
  p_status text
)
returns table (
  id uuid,
  trainer_id uuid,
  day date,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_status text := coalesce(p_status, '');
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_organization_id is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;

  if p_trainer_id is null then
    raise exception 'TRAINER_REQUIRED';
  end if;

  if p_day is null then
    raise exception 'DAY_REQUIRED';
  end if;

  if clean_status not in ('', 'dispo', 'indispo') then
    raise exception 'INVALID_AVAILABILITY_STATUS';
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

  if not exists (
    select 1
    from public.organization_trainers ot
    where ot.organization_id = p_organization_id
      and ot.trainer_id = p_trainer_id
  ) then
    raise exception 'TRAINER_NOT_IN_ORGANIZATION';
  end if;

  perform set_config(
    'timeforma.availability_source',
    'organization',
    true
  );

  perform set_config(
    'timeforma.organization_id',
    p_organization_id::text,
    true
  );

  insert into public.organization_trainer_availability (
    organization_id,
    trainer_id,
    day,
    status,
    updated_at
  )
  values (
    p_organization_id,
    p_trainer_id,
    p_day,
    clean_status,
    now()
  )
  on conflict on constraint organization_trainer_availability_unique
  do update set
    status = excluded.status,
    updated_at = now();

  return query
  select
    ota.id,
    ota.trainer_id,
    ota.day,
    ota.status,
    ota.updated_at
  from public.organization_trainer_availability ota
  where ota.organization_id = p_organization_id
    and ota.trainer_id = p_trainer_id
    and ota.day = p_day;
end;
$$;

revoke all on function public.set_organization_trainer_availability(
  uuid, uuid, date, text
) from public;

grant execute on function public.set_organization_trainer_availability(
  uuid, uuid, date, text
) to authenticated;
