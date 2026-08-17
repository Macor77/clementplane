-- ==========================================================
-- SPRINT 10.1 — RLS DÉFINITIVE DE TRAINERS
-- ==========================================================
--
-- Objectifs :
-- - supprimer les anciennes politiques Public Read / Public Write ;
-- - interdire l'accès direct anonyme à trainers ;
-- - permettre à un utilisateur authentifié de lire uniquement :
--     * sa propre fiche formateur ;
--     * les formateurs liés à l'un de ses organismes ;
-- - supprimer les écritures directes depuis le navigateur ;
-- - centraliser les écritures OF dans des RPC security definer ;
-- - empêcher un OF de modifier une fiche revendiquée.
-- ==========================================================


-- ----------------------------------------------------------
-- 1. Nettoyage des anciennes politiques permissives
-- ----------------------------------------------------------

alter table public.trainers
enable row level security;

drop policy if exists
  "Public Read"
on public.trainers;

drop policy if exists
  "Public Write"
on public.trainers;

drop policy if exists
  "Users can read allowed trainers"
on public.trainers;


-- ----------------------------------------------------------
-- 2. Lecture sécurisée
-- ----------------------------------------------------------
--
-- Un utilisateur authentifié peut lire :
-- - sa propre fiche formateur ;
-- - une fiche liée à l'un de ses organismes.
--
-- Un OF non lié ne peut pas lire trainers directement.
-- La recherche globale passe uniquement par la RPC sécurisée.
-- ----------------------------------------------------------

create policy
  "Users can read allowed trainers"
on public.trainers
for select
to authenticated
using (
  trainers.user_id = auth.uid()

  or exists (
    select 1
    from public.organization_trainers ot
    where ot.trainer_id = trainers.id
      and public.is_organization_member(
        ot.organization_id
      )
  )
);


-- ----------------------------------------------------------
-- 3. Privilèges directs de table
-- ----------------------------------------------------------
--
-- Aucun accès direct pour anon.
-- authenticated peut uniquement lire les lignes autorisées
-- par la RLS.
--
-- Toutes les écritures métier passent désormais par des RPC
-- security definer contrôlées.
-- ----------------------------------------------------------

revoke all
on table public.trainers
from anon;

revoke insert, update, delete
on table public.trainers
from authenticated;

grant select
on table public.trainers
to authenticated;


-- ----------------------------------------------------------
-- 4. Création sécurisée d'un formateur par un OF
-- ----------------------------------------------------------

create or replace function public.create_trainer_for_organization(
  p_organization_id uuid,
  p_prenom text,
  p_nom text,
  p_competences text[] default '{}'::text[],
  p_materiel text[] default '{}'::text[],
  p_telephone text default null,
  p_email text default null,
  p_ville text default null,
  p_code_postal text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_statut text default 'Standard',
  p_tarif numeric default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'ORGANIZATION_ACCESS_DENIED';
  end if;

  if
    nullif(
      btrim(
        coalesce(
          p_prenom,
          ''
        )
      ),
      ''
    ) is null
    or nullif(
      btrim(
        coalesce(
          p_nom,
          ''
        )
      ),
      ''
    ) is null
  then
    raise exception
      'NAME_REQUIRED';
  end if;

  insert into public.trainers (
    prenom,
    nom,
    competences,
    materiel,
    telephone,
    email,
    statut,
    user_id
  )
  values (
    btrim(
      p_prenom
    ),
    btrim(
      p_nom
    ),
    coalesce(
      p_competences,
      '{}'::text[]
    ),
    coalesce(
      p_materiel,
      '{}'::text[]
    ),
    nullif(
      btrim(
        coalesce(
          p_telephone,
          ''
        )
      ),
      ''
    ),
    nullif(
      btrim(
        coalesce(
          p_email,
          ''
        )
      ),
      ''
    ),
    'Standard',
    null
  )
  returning id
  into v_trainer_id;

  insert into public.organization_trainers (
    organization_id,
    trainer_id,
    statut,
    tarif,
    notes,
    ville,
    code_postal,
    latitude,
    longitude,
    created_by_user_id
  )
  values (
    p_organization_id,
    v_trainer_id,
    coalesce(
      nullif(
        btrim(
          coalesce(
            p_statut,
            ''
          )
        ),
        ''
      ),
      'Standard'
    ),
    p_tarif,
    nullif(
      btrim(
        coalesce(
          p_notes,
          ''
        )
      ),
      ''
    ),
    nullif(
      btrim(
        coalesce(
          p_ville,
          ''
        )
      ),
      ''
    ),
    nullif(
      btrim(
        coalesce(
          p_code_postal,
          ''
        )
      ),
      ''
    ),
    p_latitude,
    p_longitude,
    auth.uid()
  );

  return v_trainer_id;
end;
$$;


revoke all
on function public.create_trainer_for_organization(
  uuid,
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  numeric,
  text
)
from public;


grant execute
on function public.create_trainer_for_organization(
  uuid,
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  numeric,
  text
)
to authenticated;


-- ----------------------------------------------------------
-- 5. Modification sécurisée d'une fiche NON revendiquée
-- ----------------------------------------------------------
--
-- La fonction vérifie :
-- - l'appartenance de l'utilisateur à l'OF ;
-- - l'existence de la relation OF / formateur ;
-- - l'absence de user_id sur la fiche globale.
--
-- Si la fiche est revendiquée entre-temps, l'UPDATE est refusé.
-- ----------------------------------------------------------

create or replace function public.update_unclaimed_trainer_for_organization(
  p_organization_id uuid,
  p_trainer_id uuid,
  p_prenom text,
  p_nom text,
  p_competences text[] default '{}'::text[],
  p_materiel text[] default '{}'::text[],
  p_telephone text default null,
  p_email text default null,
  p_ville text default null,
  p_code_postal text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_statut text default 'Standard',
  p_tarif numeric default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'ORGANIZATION_ACCESS_DENIED';
  end if;

  if not exists (
    select 1
    from public.organization_trainers ot
    where
      ot.organization_id =
        p_organization_id
      and ot.trainer_id =
        p_trainer_id
  ) then
    raise exception
      'TRAINER_NOT_IN_ORGANIZATION';
  end if;

  if exists (
    select 1
    from public.trainers t
    where
      t.id =
        p_trainer_id
      and t.user_id is not null
  ) then
    raise exception
      'TRAINER_PROFILE_CLAIMED';
  end if;

  if
    nullif(
      btrim(
        coalesce(
          p_prenom,
          ''
        )
      ),
      ''
    ) is null
    or nullif(
      btrim(
        coalesce(
          p_nom,
          ''
        )
      ),
      ''
    ) is null
  then
    raise exception
      'NAME_REQUIRED';
  end if;

  update public.trainers
  set
    prenom =
      btrim(
        p_prenom
      ),
    nom =
      btrim(
        p_nom
      ),
    competences =
      coalesce(
        p_competences,
        '{}'::text[]
      ),
    materiel =
      coalesce(
        p_materiel,
        '{}'::text[]
      ),
    telephone =
      nullif(
        btrim(
          coalesce(
            p_telephone,
            ''
          )
        ),
        ''
      ),
    email =
      nullif(
        btrim(
          coalesce(
            p_email,
            ''
          )
        ),
        ''
      )
  where
    id =
      p_trainer_id
    and user_id is null;

  if not found then
    raise exception
      'TRAINER_PROFILE_CLAIMED_OR_NOT_FOUND';
  end if;

  update public.organization_trainers
  set
    statut =
      coalesce(
        nullif(
          btrim(
            coalesce(
              p_statut,
              ''
            )
          ),
          ''
        ),
        'Standard'
      ),
    tarif =
      p_tarif,
    notes =
      nullif(
        btrim(
          coalesce(
            p_notes,
            ''
          )
        ),
        ''
      ),
    ville =
      nullif(
        btrim(
          coalesce(
            p_ville,
            ''
          )
        ),
        ''
      ),
    code_postal =
      nullif(
        btrim(
          coalesce(
            p_code_postal,
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
    organization_id =
      p_organization_id
    and trainer_id =
      p_trainer_id;

  return p_trainer_id;
end;
$$;


revoke all
on function public.update_unclaimed_trainer_for_organization(
  uuid,
  uuid,
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  numeric,
  text
)
from public;


grant execute
on function public.update_unclaimed_trainer_for_organization(
  uuid,
  uuid,
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  numeric,
  text
)
to authenticated;
