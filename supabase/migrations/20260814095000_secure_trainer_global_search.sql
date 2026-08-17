-- ==========================================================
-- SPRINT 10.1 — RECHERCHE SÉCURISÉE DES FORMATEURS
-- ==========================================================
-- Objectifs :
-- - empêcher l'exploration libre de la base trainers ;
-- - supprimer la recherche partielle par quelques caractères ;
-- - autoriser uniquement :
--     1. une adresse e-mail complète et exacte ;
--     2. une identité complète et exacte (Prénom Nom / Nom Prénom) ;
-- - ne jamais révéler les coordonnées d'un formateur qui
--   n'appartient pas encore au réseau de l'OF ;
-- - conserver temporairement la signature actuelle de la RPC
--   afin de ne pas casser l'interface avant son refactoring.
-- ==========================================================


create or replace function public.search_trainers_for_organization(
  p_organization_id uuid,
  p_query text
)
returns table (
  id uuid,
  prenom text,
  nom text,
  ville text,
  code_postal text,
  email text,
  already_in_network boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with search_input as (
    select
      btrim(coalesce(p_query, '')) as raw_query,

      lower(
        regexp_replace(
          btrim(coalesce(p_query, '')),
          '\s+',
          ' ',
          'g'
        )
      ) as normalized_query
  ),

  matched_trainers as (
    select
      t.id,
      t.prenom,
      t.nom,
      t.ville,
      t.code_postal,
      t.email,

      exists (
        select 1
        from public.organization_trainers ot
        where ot.organization_id = p_organization_id
          and ot.trainer_id = t.id
      ) as already_in_network

    from public.trainers t
    cross join search_input s

    where
      public.is_organization_member(p_organization_id)

      and s.raw_query <> ''

      and (

        -- --------------------------------------------------
        -- CAS 1 : RECHERCHE PAR E-MAIL
        -- L'adresse saisie doit être complète et correspondre
        -- exactement à l'adresse enregistrée.
        -- --------------------------------------------------
        (
          position('@' in s.raw_query) > 1

          and lower(
            btrim(
              coalesce(t.email, '')
            )
          ) = lower(s.raw_query)
        )

        or

        -- --------------------------------------------------
        -- CAS 2 : RECHERCHE PAR IDENTITÉ COMPLÈTE
        -- Aucun ILIKE / aucune recherche partielle.
        --
        -- Les deux ordres sont acceptés :
        --   Prénom Nom
        --   Nom Prénom
        -- --------------------------------------------------
        (
          position(' ' in s.normalized_query) > 0

          and (
            lower(
              regexp_replace(
                btrim(
                  concat_ws(
                    ' ',
                    t.prenom,
                    t.nom
                  )
                ),
                '\s+',
                ' ',
                'g'
              )
            ) = s.normalized_query

            or

            lower(
              regexp_replace(
                btrim(
                  concat_ws(
                    ' ',
                    t.nom,
                    t.prenom
                  )
                ),
                '\s+',
                ' ',
                'g'
              )
            ) = s.normalized_query
          )
        )
      )
  )

  select
    mt.id,
    mt.prenom,
    mt.nom,

    -- Les coordonnées géographiques ne sont visibles
    -- que si le formateur appartient déjà au réseau.
    case
      when mt.already_in_network then mt.ville
      else null
    end as ville,

    case
      when mt.already_in_network then mt.code_postal
      else null
    end as code_postal,

    -- L'e-mail ne doit JAMAIS être révélé à un OF
    -- qui n'est pas encore lié au formateur.
    case
      when mt.already_in_network then mt.email
      else null
    end as email,

    mt.already_in_network

  from matched_trainers mt

  order by
    lower(coalesce(mt.nom, '')),
    lower(coalesce(mt.prenom, ''))

  limit 10;
$$;


revoke all
on function public.search_trainers_for_organization(uuid, text)
from public;


grant execute
on function public.search_trainers_for_organization(uuid, text)
to authenticated;
