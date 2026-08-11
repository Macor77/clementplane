-- ==========================================================
-- MINI SPRINT 8.3.2
-- Revendication sécurisée d'une fiche formateur
-- ==========================================================

-- Retourne uniquement les informations nécessaires pour identifier une fiche
-- correspondant EXACTEMENT à l'adresse e-mail du compte connecté.
create or replace function public.get_my_trainer_claim_candidates()
returns table (
  id uuid,
  prenom text,
  nom text,
  email text,
  telephone text,
  ville text,
  code_postal text,
  already_linked_to_me boolean
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
    t.ville,
    t.code_postal,
    (t.user_id = auth.uid()) as already_linked_to_me
  from public.trainers t
  where auth.uid() is not null
    and nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), '') is not null
    and lower(btrim(coalesce(t.email, ''))) = lower(btrim(auth.jwt() ->> 'email'))
    and (t.user_id is null or t.user_id = auth.uid())
  order by t.created_at asc;
$$;

revoke all on function public.get_my_trainer_claim_candidates() from public;
grant execute on function public.get_my_trainer_claim_candidates() to authenticated;

-- Revendique une fiche existante. Le rattachement n'est possible que si :
-- 1. l'utilisateur est connecté ;
-- 2. l'e-mail de la fiche correspond exactement à son e-mail Auth ;
-- 3. la fiche n'est pas déjà rattachée à quelqu'un d'autre ;
-- 4. l'utilisateur ne possède pas déjà une autre fiche formateur.
create or replace function public.claim_my_trainer_profile(target_trainer_id uuid)
returns table (
  id uuid,
  prenom text,
  nom text,
  email text,
  telephone text,
  ville text,
  code_postal text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  target_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if current_email = '' then
    raise exception 'EMAIL_REQUIRED';
  end if;

  if exists (
    select 1
    from public.trainers t
    where t.user_id = current_user_id
      and t.id <> target_trainer_id
  ) then
    raise exception 'TRAINER_PROFILE_ALREADY_LINKED';
  end if;

  select t.user_id
  into target_user_id
  from public.trainers t
  where t.id = target_trainer_id
    and lower(btrim(coalesce(t.email, ''))) = current_email
  for update;

  if not found then
    raise exception 'TRAINER_PROFILE_NOT_FOUND';
  end if;

  if target_user_id is not null and target_user_id <> current_user_id then
    raise exception 'TRAINER_PROFILE_ALREADY_CLAIMED';
  end if;

  update public.trainers
  set user_id = current_user_id
  where trainers.id = target_trainer_id;

  return query
  select
    t.id,
    t.prenom,
    t.nom,
    t.email,
    t.telephone,
    t.ville,
    t.code_postal
  from public.trainers t
  where t.id = target_trainer_id;
end;
$$;

revoke all on function public.claim_my_trainer_profile(uuid) from public;
grant execute on function public.claim_my_trainer_profile(uuid) to authenticated;

-- Crée une nouvelle fiche lorsque l'adresse e-mail du compte n'existe pas encore
-- dans la base. Les données internes OF (notes, tarif, statut relationnel...) ne
-- sont jamais fournies par le formateur. Le statut technique reste Inactif pour
-- préserver le comportement actuel du listing OF.
create or replace function public.create_my_trainer_profile(
  p_first_name text,
  p_last_name text,
  p_phone text default null,
  p_city text default null,
  p_postal_code text default null
)
returns table (
  id uuid,
  prenom text,
  nom text,
  email text,
  telephone text,
  ville text,
  code_postal text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  created_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if current_email = '' then
    raise exception 'EMAIL_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_first_name, '')), '') is null
     or nullif(btrim(coalesce(p_last_name, '')), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  if exists (select 1 from public.trainers t where t.user_id = current_user_id) then
    raise exception 'TRAINER_PROFILE_ALREADY_LINKED';
  end if;

  -- Toute fiche utilisant déjà cet e-mail interdit la création d'un doublon.
  -- Si elle est libre, l'utilisateur doit la revendiquer ; si elle est déjà
  -- rattachée, la situation doit être traitée séparément.
  if exists (
    select 1
    from public.trainers t
    where lower(btrim(coalesce(t.email, ''))) = current_email
  ) then
    raise exception 'MATCHING_TRAINER_PROFILE_EXISTS';
  end if;

  insert into public.trainers (
    prenom,
    nom,
    email,
    telephone,
    ville,
    code_postal,
    statut,
    user_id
  ) values (
    btrim(p_first_name),
    btrim(p_last_name),
    current_email,
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_city, '')), ''),
    nullif(btrim(coalesce(p_postal_code, '')), ''),
    'Inactif',
    current_user_id
  )
  returning trainers.id into created_id;

  return query
  select
    t.id,
    t.prenom,
    t.nom,
    t.email,
    t.telephone,
    t.ville,
    t.code_postal
  from public.trainers t
  where t.id = created_id;
end;
$$;

revoke all on function public.create_my_trainer_profile(text, text, text, text, text) from public;
grant execute on function public.create_my_trainer_profile(text, text, text, text, text) to authenticated;
