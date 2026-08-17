-- ==========================================================
-- SPRINT 10.2 — NETTOYAGE HISTORIQUE DES COMPÉTENCES
-- ==========================================================
--
-- Normalise uniquement les compétences canoniques déjà validées :
-- - SST
-- - Incendie
-- - PRAP IBC
--
-- Les autres valeurs sont laissées intactes.
-- Le matériel n'est pas concerné par cette migration.
-- ==========================================================

begin;

-- ----------------------------------------------------------
-- 1. Catalogue global : libellés canoniques
-- ----------------------------------------------------------

update public.competency_catalog
set name = 'SST'
where normalized_name = public.normalize_competency_name('SST');

update public.competency_catalog
set name = 'Incendie'
where normalized_name = public.normalize_competency_name('Incendie');

update public.competency_catalog
set name = 'PRAP IBC'
where normalized_name = public.normalize_competency_name('PRAP IBC');


-- ----------------------------------------------------------
-- 2. Fiches formateurs
-- ----------------------------------------------------------

update public.trainers t
set competences = (
  select coalesce(
    array_agg(
      case
        when public.normalize_competency_name(value) = 'sst'
          then 'SST'
        when public.normalize_competency_name(value) = 'incendie'
          then 'Incendie'
        when public.normalize_competency_name(value) = 'prap ibc'
          then 'PRAP IBC'
        else btrim(value)
      end
      order by ordinality
    ),
    '{}'::text[]
  )
  from unnest(coalesce(t.competences, '{}'::text[]))
    with ordinality as u(value, ordinality)
)
where exists (
  select 1
  from unnest(coalesce(t.competences, '{}'::text[])) as u(value)
  where public.normalize_competency_name(value)
    in ('sst', 'incendie', 'prap ibc')
);


-- ----------------------------------------------------------
-- 3. Missions
-- ----------------------------------------------------------

update public.missions m
set competences = (
  select coalesce(
    array_agg(
      case
        when public.normalize_competency_name(value) = 'sst'
          then 'SST'
        when public.normalize_competency_name(value) = 'incendie'
          then 'Incendie'
        when public.normalize_competency_name(value) = 'prap ibc'
          then 'PRAP IBC'
        else btrim(value)
      end
      order by ordinality
    ),
    '{}'::text[]
  )
  from unnest(coalesce(m.competences, '{}'::text[]))
    with ordinality as u(value, ordinality)
)
where exists (
  select 1
  from unnest(coalesce(m.competences, '{}'::text[])) as u(value)
  where public.normalize_competency_name(value)
    in ('sst', 'incendie', 'prap ibc')
);

commit;
