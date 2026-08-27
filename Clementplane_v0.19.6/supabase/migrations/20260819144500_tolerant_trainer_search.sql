-- ==========================================================
-- SPRINT 11.3.4
-- Recherche formateurs tolérante aux accents et séparateurs
-- ==========================================================
-- Objectifs :
-- - Andrea Talantsi retrouve Andréa Talantsi ;
-- - Jean Pierre retrouve Jean-Pierre ;
-- - ignorer casse, accents, apostrophes, tirets et espaces multiples ;
-- - conserver la règle de sécurité du Sprint 10 :
--   recherche uniquement par e-mail exact OU identité complète.
-- ==========================================================

create extension if not exists unaccent with schema extensions;

create or replace function public.normalize_trainer_search_text(p_value text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select
    btrim(
      regexp_replace(
        lower(
          extensions.unaccent(
            regexp_replace(
              coalesce(p_value, ''),
              '[-‐‑‒–—''’`´]+',
              ' ',
              'g'
            )
          )
        ),
        '\s+',
        ' ',
        'g'
      )
    );
$$;

revoke all
on function public.normalize_trainer_search_text(text)
from public;

grant execute
on function public.normalize_trainer_search_text(text)
to authenticated;


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
set search_path = public, extensions
as $$
  with search_input as (
    select
      btrim(coalesce(p_query, '')) as raw_query,
      public.normalize_trainer_search_text(p_query) as normalized_query
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
        -- CAS 1 : E-MAIL COMPLET ET EXACT
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
        -- CAS 2 : IDENTITÉ COMPLÈTE
        --
        -- Tolérances :
        -- - accents : Andréa = Andrea
        -- - tirets : Jean-Pierre = Jean Pierre
        -- - apostrophes : D'Angelo = D Angelo
        -- - casse
        -- - espaces multiples
        --
        -- Les deux ordres restent acceptés :
        --   Prénom Nom
        --   Nom Prénom
        --
        -- Il ne s'agit PAS d'une recherche approximative :
        -- une faute d'orthographe reste une non-correspondance.
        -- --------------------------------------------------
        (
          position(' ' in s.normalized_query) > 0

          and (
            public.normalize_trainer_search_text(
              concat_ws(
                ' ',
                t.prenom,
                t.nom
              )
            ) = s.normalized_query

            or

            public.normalize_trainer_search_text(
              concat_ws(
                ' ',
                t.nom,
                t.prenom
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

    case
      when mt.already_in_network then mt.ville
      else null
    end as ville,

    case
      when mt.already_in_network then mt.code_postal
      else null
    end as code_postal,

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
