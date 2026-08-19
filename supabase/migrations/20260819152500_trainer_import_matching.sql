-- ==========================================================
-- FORMAPLANE — SPRINT 11.4.2
-- Rapprochement intelligent des formateurs importés
-- ==========================================================
-- Principes :
-- - aucune écriture en base ;
-- - les lignes invalides ne sont jamais envoyées à cette RPC ;
-- - recherche limitée aux correspondances crédibles :
--     * e-mail exact ;
--     * identité complète normalisée ;
-- - accents, apostrophes et tirets neutralisés via
--   normalize_trainer_search_text() créée au Sprint 11.3.4 ;
-- - au maximum 3 candidats par ligne ;
-- - aucune coordonnée privée d'un formateur hors réseau n'est révélée.
-- ==========================================================

create or replace function public.match_trainer_import_candidates(
  p_organization_id uuid,
  p_rows jsonb
)
returns table (
  import_index integer,
  trainer_id uuid,
  prenom text,
  nom text,
  already_in_network boolean,
  claimed boolean,
  match_score integer,
  email_match boolean,
  phone_match boolean,
  location_match boolean,
  name_match boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with input_rows as (
    select
      nullif(item ->> 'import_index', '')::integer as import_index,

      public.normalize_trainer_search_text(
        concat_ws(
          ' ',
          item ->> 'first_name',
          item ->> 'last_name'
        )
      ) as normalized_full_name,

      lower(
        btrim(
          coalesce(
            item ->> 'email',
            ''
          )
        )
      ) as normalized_email,

      regexp_replace(
        coalesce(
          item ->> 'phone',
          ''
        ),
        '[^0-9]+',
        '',
        'g'
      ) as normalized_phone,

      public.normalize_trainer_search_text(
        item ->> 'city'
      ) as normalized_city,

      regexp_replace(
        coalesce(
          item ->> 'postal_code',
          ''
        ),
        '\s+',
        '',
        'g'
      ) as normalized_postal_code

    from jsonb_array_elements(
      coalesce(
        p_rows,
        '[]'::jsonb
      )
    ) as item
  ),

  candidate_base as (
    select
      i.import_index,
      t.id as trainer_id,
      t.prenom,
      t.nom,

      exists (
        select 1
        from public.organization_trainers ot
        where ot.organization_id = p_organization_id
          and ot.trainer_id = t.id
      ) as already_in_network,

      (t.user_id is not null) as claimed,

      (
        i.normalized_email <> ''
        and lower(
          btrim(
            coalesce(
              t.email,
              ''
            )
          )
        ) = i.normalized_email
      ) as email_match,

      (
        i.normalized_phone <> ''
        and regexp_replace(
          coalesce(
            t.telephone,
            ''
          ),
          '[^0-9]+',
          '',
          'g'
        ) = i.normalized_phone
      ) as phone_match,

      (
        (
          i.normalized_city <> ''
          and public.normalize_trainer_search_text(
            t.ville
          ) = i.normalized_city
        )
        or
        (
          i.normalized_postal_code <> ''
          and regexp_replace(
            coalesce(
              t.code_postal,
              ''
            ),
            '\s+',
            '',
            'g'
          ) = i.normalized_postal_code
        )
      ) as location_match,

      (
        i.normalized_full_name <> ''
        and public.normalize_trainer_search_text(
          concat_ws(
            ' ',
            t.prenom,
            t.nom
          )
        ) = i.normalized_full_name
      ) as name_match

    from input_rows i
    join public.trainers t
      on (
        (
          i.normalized_email <> ''
          and lower(
            btrim(
              coalesce(
                t.email,
                ''
              )
            )
          ) = i.normalized_email
        )
        or
        (
          i.normalized_full_name <> ''
          and public.normalize_trainer_search_text(
            concat_ws(
              ' ',
              t.prenom,
              t.nom
            )
          ) = i.normalized_full_name
        )
      )

    where
      i.import_index is not null
      and public.is_organization_member(
        p_organization_id
      )
  ),

  scored as (
    select
      cb.*,

      case
        when cb.email_match then 100

        when cb.name_match
          and cb.phone_match
          and cb.location_match
          then 96

        when cb.name_match
          and cb.phone_match
          then 92

        when cb.name_match
          and cb.location_match
          then 84

        when cb.name_match
          then 70

        else 0
      end as match_score

    from candidate_base cb
  ),

  ranked as (
    select
      s.*,

      row_number() over (
        partition by s.import_index
        order by
          s.match_score desc,
          s.already_in_network desc,
          s.claimed desc,
          lower(
            coalesce(
              s.nom,
              ''
            )
          ),
          lower(
            coalesce(
              s.prenom,
              ''
            )
          )
      ) as candidate_rank

    from scored s

    where s.match_score >= 70
  )

  select
    r.import_index,
    r.trainer_id,
    r.prenom,
    r.nom,
    r.already_in_network,
    r.claimed,
    r.match_score,
    r.email_match,
    r.phone_match,
    r.location_match,
    r.name_match

  from ranked r

  where r.candidate_rank <= 3

  order by
    r.import_index,
    r.candidate_rank;
$$;


revoke all
on function public.match_trainer_import_candidates(
  uuid,
  jsonb
)
from public;


grant execute
on function public.match_trainer_import_candidates(
  uuid,
  jsonb
)
to authenticated;
