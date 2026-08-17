-- ==========================================================
-- SPRINT 10.1.4C
-- LOCALISATION DU FORMATEUR REVENDIQUÉ + GPS
-- ==========================================================
--
-- Règles :
-- - profil non revendiqué : localisation privée par OF
--   dans organization_trainers ;
-- - profil revendiqué : localisation globale pilotée par
--   le formateur dans trainers ;
-- - le client géocode Ville + CP via l'Edge Function existante
--   puis transmet latitude / longitude aux RPC sécurisées ;
-- - en cas d'échec du géocodage, les nouvelles coordonnées
--   sont enregistrées à NULL afin de ne jamais conserver le
--   GPS d'une ancienne localisation.
-- ==========================================================


-- ----------------------------------------------------------
-- 1. REVENDICATION D'UNE FICHE EXISTANTE
-- ----------------------------------------------------------

drop function if exists
  public.claim_my_trainer_profile(uuid);


create or replace function public.claim_my_trainer_profile(
  target_trainer_id uuid,
  p_city text,
  p_postal_code text,
  p_latitude double precision default null,
  p_longitude double precision default null
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
  current_email text :=
    lower(
      btrim(
        coalesce(
          auth.jwt() ->> 'email',
          ''
        )
      )
    );
  target_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if current_email = '' then
    raise exception 'EMAIL_REQUIRED';
  end if;

  if nullif(
    btrim(
      coalesce(
        p_city,
        ''
      )
    ),
    ''
  ) is null
  or nullif(
    btrim(
      coalesce(
        p_postal_code,
        ''
      )
    ),
    ''
  ) is null then
    raise exception 'LOCATION_REQUIRED';
  end if;

  if exists (
    select 1
    from public.trainers t
    where t.user_id =
      current_user_id
      and t.id <>
        target_trainer_id
  ) then
    raise exception
      'TRAINER_PROFILE_ALREADY_LINKED';
  end if;

  select
    t.user_id
  into
    target_user_id
  from public.trainers t
  where
    t.id =
      target_trainer_id
    and lower(
      btrim(
        coalesce(
          t.email,
          ''
        )
      )
    ) =
      current_email
  for update;

  if not found then
    raise exception
      'TRAINER_PROFILE_NOT_FOUND';
  end if;

  if
    target_user_id is not null
    and target_user_id <>
      current_user_id
  then
    raise exception
      'TRAINER_PROFILE_ALREADY_CLAIMED';
  end if;

  update public.trainers
  set
    user_id =
      current_user_id,
    ville =
      nullif(
        btrim(
          coalesce(
            p_city,
            ''
          )
        ),
        ''
      ),
    code_postal =
      nullif(
        btrim(
          coalesce(
            p_postal_code,
            ''
          )
        ),
        ''
      ),
    latitude =
      p_latitude,
    longitude =
      p_longitude
  where
    trainers.id =
      target_trainer_id;

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
  where
    t.id =
      target_trainer_id;
end;
$$;


revoke all
on function public.claim_my_trainer_profile(
  uuid,
  text,
  text,
  double precision,
  double precision
)
from public;


grant execute
on function public.claim_my_trainer_profile(
  uuid,
  text,
  text,
  double precision,
  double precision
)
to authenticated;


-- ----------------------------------------------------------
-- 2. CRÉATION D'UN NOUVEAU PROFIL FORMATEUR
-- ----------------------------------------------------------

drop function if exists
  public.create_my_trainer_profile(
    text,
    text,
    text,
    text,
    text
  );


create or replace function public.create_my_trainer_profile(
  p_first_name text,
  p_last_name text,
  p_phone text default null,
  p_city text default null,
  p_postal_code text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
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
  current_user_id uuid :=
    auth.uid();
  current_email text :=
    lower(
      btrim(
        coalesce(
          auth.jwt() ->> 'email',
          ''
        )
      )
    );
  created_id uuid;
begin
  if current_user_id is null then
    raise exception
      'AUTH_REQUIRED';
  end if;

  if current_email = '' then
    raise exception
      'EMAIL_REQUIRED';
  end if;

  if
    nullif(
      btrim(
        coalesce(
          p_first_name,
          ''
        )
      ),
      ''
    ) is null
    or nullif(
      btrim(
        coalesce(
          p_last_name,
          ''
        )
      ),
      ''
    ) is null
  then
    raise exception
      'NAME_REQUIRED';
  end if;

  if
    nullif(
      btrim(
        coalesce(
          p_city,
          ''
        )
      ),
      ''
    ) is null
    or nullif(
      btrim(
        coalesce(
          p_postal_code,
          ''
        )
      ),
      ''
    ) is null
  then
    raise exception
      'LOCATION_REQUIRED';
  end if;

  if exists (
    select 1
    from public.trainers t
    where t.user_id =
      current_user_id
  ) then
    raise exception
      'TRAINER_PROFILE_ALREADY_LINKED';
  end if;

  if exists (
    select 1
    from public.trainers t
    where lower(
      btrim(
        coalesce(
          t.email,
          ''
        )
      )
    ) =
      current_email
  ) then
    raise exception
      'MATCHING_TRAINER_PROFILE_EXISTS';
  end if;

  insert into public.trainers (
    prenom,
    nom,
    email,
    telephone,
    ville,
    code_postal,
    latitude,
    longitude,
    statut,
    user_id
  )
  values (
    btrim(
      p_first_name
    ),
    btrim(
      p_last_name
    ),
    current_email,
    nullif(
      btrim(
        coalesce(
          p_phone,
          ''
        )
      ),
      ''
    ),
    nullif(
      btrim(
        coalesce(
          p_city,
          ''
        )
      ),
      ''
    ),
    nullif(
      btrim(
        coalesce(
          p_postal_code,
          ''
        )
      ),
      ''
    ),
    p_latitude,
    p_longitude,
    'Inactif',
    current_user_id
  )
  returning
    trainers.id
  into
    created_id;

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
  where
    t.id =
      created_id;
end;
$$;


revoke all
on function public.create_my_trainer_profile(
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision
)
from public;


grant execute
on function public.create_my_trainer_profile(
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision
)
to authenticated;


-- ----------------------------------------------------------
-- 3. MODIFICATION DE SON PROFIL
-- ----------------------------------------------------------

drop function if exists
  public.update_my_trainer_profile(
    text,
    text,
    text,
    text,
    text,
    text,
    text[],
    text[]
  );


create or replace function public.update_my_trainer_profile(
  p_first_name text,
  p_last_name text,
  p_phone text default null,
  p_city text default null,
  p_postal_code text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
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
  current_user_id uuid :=
    auth.uid();
begin
  if current_user_id is null then
    raise exception
      'AUTH_REQUIRED';
  end if;

  if
    nullif(
      btrim(
        coalesce(
          p_first_name,
          ''
        )
      ),
      ''
    ) is null
    or nullif(
      btrim(
        coalesce(
          p_last_name,
          ''
        )
      ),
      ''
    ) is null
  then
    raise exception
      'NAME_REQUIRED';
  end if;

  if
    nullif(
      btrim(
        coalesce(
          p_city,
          ''
        )
      ),
      ''
    ) is null
    or nullif(
      btrim(
        coalesce(
          p_postal_code,
          ''
        )
      ),
      ''
    ) is null
  then
    raise exception
      'LOCATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.trainers t
    where t.user_id =
      current_user_id
  ) then
    raise exception
      'TRAINER_PROFILE_NOT_FOUND';
  end if;

  update public.trainers
  set
    prenom =
      btrim(
        p_first_name
      ),
    nom =
      btrim(
        p_last_name
      ),
    telephone =
      nullif(
        btrim(
          coalesce(
            p_phone,
            ''
          )
        ),
        ''
      ),
    adresse =
      null,
    ville =
      nullif(
        btrim(
          coalesce(
            p_city,
            ''
          )
        ),
        ''
      ),
    code_postal =
      nullif(
        btrim(
          coalesce(
            p_postal_code,
            ''
          )
        ),
        ''
      ),
    latitude =
      p_latitude,
    longitude =
      p_longitude,
    competences =
      coalesce(
        p_skills,
        '{}'::text[]
      ),
    materiel =
      coalesce(
        p_equipment,
        '{}'::text[]
      )
  where
    user_id =
      current_user_id;

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
    coalesce(
      t.competences,
      '{}'::text[]
    ),
    coalesce(
      t.materiel,
      '{}'::text[]
    )
  from public.trainers t
  where
    t.user_id =
      current_user_id
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
  double precision,
  double precision,
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
  double precision,
  double precision,
  text[],
  text[]
)
to authenticated;
