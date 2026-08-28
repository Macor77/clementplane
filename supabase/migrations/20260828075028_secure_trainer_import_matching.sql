-- Clementplane - Pre-launch security hardening
-- Prevent trainer import matching from being used to enumerate trainers
-- outside the current organization's network.
--
-- Rules:
-- - trainers already referenced by the organization keep the existing
--   matching behaviour;
-- - trainers outside the organization may only be returned on an exact
--   email match;
-- - sensitive matching signals and claimed status are hidden for trainers
--   outside the organization network.

CREATE OR REPLACE FUNCTION public.match_trainer_import_candidates(
    p_organization_id uuid,
    p_rows jsonb
)
RETURNS TABLE(
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  WITH input_rows AS (
    SELECT
      nullif(item ->> 'import_index', '')::integer AS import_index,

      public.normalize_trainer_search_text(
        concat_ws(
          ' ',
          item ->> 'first_name',
          item ->> 'last_name'
        )
      ) AS normalized_full_name,

      lower(
        btrim(
          coalesce(
            item ->> 'email',
            ''
          )
        )
      ) AS normalized_email,

      regexp_replace(
        coalesce(
          item ->> 'phone',
          ''
        ),
        '[^0-9]+',
        '',
        'g'
      ) AS normalized_phone,

      public.normalize_trainer_search_text(
        item ->> 'city'
      ) AS normalized_city,

      regexp_replace(
        coalesce(
          item ->> 'postal_code',
          ''
        ),
        '\s+',
        '',
        'g'
      ) AS normalized_postal_code

    FROM jsonb_array_elements(
      coalesce(
        p_rows,
        '[]'::jsonb
      )
    ) AS item
  ),

  candidate_raw AS (
    SELECT
      i.import_index,
      t.id AS trainer_id,
      t.prenom,
      t.nom,

      EXISTS (
        SELECT 1
        FROM public.organization_trainers ot
        WHERE ot.organization_id = p_organization_id
          AND ot.trainer_id = t.id
      ) AS already_in_network,

      (t.user_id IS NOT NULL) AS claimed_raw,

      (
        i.normalized_email <> ''
        AND lower(
          btrim(
            coalesce(
              t.email,
              ''
            )
          )
        ) = i.normalized_email
      ) AS email_match_raw,

      (
        i.normalized_phone <> ''
        AND regexp_replace(
          coalesce(
            t.telephone,
            ''
          ),
          '[^0-9]+',
          '',
          'g'
        ) = i.normalized_phone
      ) AS phone_match_raw,

      (
        (
          i.normalized_city <> ''
          AND public.normalize_trainer_search_text(
            t.ville
          ) = i.normalized_city
        )
        OR
        (
          i.normalized_postal_code <> ''
          AND regexp_replace(
            coalesce(
              t.code_postal,
              ''
            ),
            '\s+',
            '',
            'g'
          ) = i.normalized_postal_code
        )
      ) AS location_match_raw,

      (
        i.normalized_full_name <> ''
        AND public.normalize_trainer_search_text(
          concat_ws(
            ' ',
            t.prenom,
            t.nom
          )
        ) = i.normalized_full_name
      ) AS name_match_raw

    FROM input_rows i

    JOIN public.trainers t
      ON (
        (
          i.normalized_email <> ''
          AND lower(
            btrim(
              coalesce(
                t.email,
                ''
              )
            )
          ) = i.normalized_email
        )
        OR
        (
          i.normalized_full_name <> ''
          AND public.normalize_trainer_search_text(
            concat_ws(
              ' ',
              t.prenom,
              t.nom
            )
          ) = i.normalized_full_name
        )
      )

    WHERE i.import_index IS NOT NULL
      AND public.is_organization_member(
        p_organization_id
      )
  ),

  candidate_base AS (
    SELECT
      cr.import_index,
      cr.trainer_id,
      cr.prenom,
      cr.nom,
      cr.already_in_network,

      CASE
        WHEN cr.already_in_network
          THEN cr.claimed_raw
        ELSE false
      END AS claimed,

      cr.email_match_raw AS email_match,

      CASE
        WHEN cr.already_in_network
          THEN cr.phone_match_raw
        ELSE false
      END AS phone_match,

      CASE
        WHEN cr.already_in_network
          THEN cr.location_match_raw
        ELSE false
      END AS location_match,

      CASE
        WHEN cr.already_in_network
          THEN cr.name_match_raw
        ELSE false
      END AS name_match

    FROM candidate_raw cr

    WHERE
      cr.already_in_network
      OR cr.email_match_raw
  ),

  scored AS (
    SELECT
      cb.*,

      CASE
        WHEN cb.email_match THEN 100

        WHEN cb.name_match
          AND cb.phone_match
          AND cb.location_match
          THEN 96

        WHEN cb.name_match
          AND cb.phone_match
          THEN 92

        WHEN cb.name_match
          AND cb.location_match
          THEN 84

        WHEN cb.name_match
          THEN 70

        ELSE 0
      END AS match_score

    FROM candidate_base cb
  ),

  ranked AS (
    SELECT
      s.*,

      row_number() OVER (
        PARTITION BY s.import_index
        ORDER BY
          s.match_score DESC,
          s.already_in_network DESC,
          s.claimed DESC,
          lower(coalesce(s.nom, '')),
          lower(coalesce(s.prenom, ''))
      ) AS candidate_rank

    FROM scored s

    WHERE s.match_score >= 70
  )

  SELECT
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

  FROM ranked r

  WHERE r.candidate_rank <= 3

  ORDER BY
    r.import_index,
    r.candidate_rank;
$function$;
