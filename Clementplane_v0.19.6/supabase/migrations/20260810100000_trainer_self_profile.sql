-- ==========================================================
-- MINI SPRINT 8.3
-- Profil personnel du formateur
-- ==========================================================

create or replace function public.get_my_trainer_profile()
returns table (
  id uuid,
  prenom text,
  nom text,
  email text,
  telephone text,
  adresse text,
  ville text,
  code_postal text,
  competences text[],
  materiel text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.prenom,
    t.nom,
    t.email,
    t.telephone,
    t.adresse,
    t.ville,
    t.code_postal,
    coalesce(t.competences, '{}'::text[]),
    coalesce(t.materiel, '{}'::text[])
  from public.trainers t
  where t.user_id = auth.uid()
  limit 1;
$$;

revoke all
on function public.get_my_trainer_profile()
from public;

grant execute
on function public.get_my_trainer_profile()
to authenticated;


create or replace function public.update_my_trainer_profile(
  p_first_name text,
  p_last_name text,
  p_phone text default null,
  p_address text default null,
  p_city text default null,
  p_postal_code text default null,
  p_skills text[] default '{}'::text[],
  p_equipment text[] default '{}'::text[]
)
returns table (
  id uuid,
  prenom text,
  nom text,
  email text,
  telephone text,
  adresse text,
  ville text,
  code_postal text,
  competences text[],
  materiel text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_first_name, '')), '') is null
     or nullif(btrim(coalesce(p_last_name, '')), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.trainers t
    where t.user_id = current_user_id
  ) then
    raise exception 'TRAINER_PROFILE_NOT_FOUND';
  end if;

  update public.trainers
  set
    prenom = btrim(p_first_name),
    nom = btrim(p_last_name),
    telephone = nullif(btrim(coalesce(p_phone, '')), ''),
    adresse = nullif(btrim(coalesce(p_address, '')), ''),
    ville = nullif(btrim(coalesce(p_city, '')), ''),
    code_postal = nullif(btrim(coalesce(p_postal_code, '')), ''),
    competences = coalesce(p_skills, '{}'::text[]),
    materiel = coalesce(p_equipment, '{}'::text[])
  where user_id = current_user_id;

  return query
  select
    t.id,
    t.prenom,
    t.nom,
    t.email,
    t.telephone,
    t.adresse,
    t.ville,
    t.code_postal,
    coalesce(t.competences, '{}'::text[]),
    coalesce(t.materiel, '{}'::text[])
  from public.trainers t
  where t.user_id = current_user_id
  limit 1;
end;
$$;

revoke all
on function public.update_my_trainer_profile(
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  text[]
)
from public;

grant execute
on function public.update_my_trainer_profile(
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  text[]
)
to authenticated;