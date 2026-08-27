-- ==========================================================
-- SPRINT 10.1 — NETTOYAGE DES FORMATEURS DE TEST
-- ==========================================================
--
-- Suppression ciblée de 3 fiches trainers de test :
-- - Test Supabase
-- - Test Revendication
-- - Test Nouveau Profil
--
-- Puis suppression des 2 comptes Auth de test associés :
-- - Test Revendication
-- - Test Nouveau Profil
--
-- Les relations dépendantes disposant de clés étrangères avec
-- ON DELETE CASCADE / SET NULL seront nettoyées automatiquement.
-- ==========================================================

begin;

-- ----------------------------------------------------------
-- 1. Sécurité : vérifier que les IDs ciblent bien les tests
-- ----------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from public.trainers
    where id = '4414cc35-b534-48bb-8267-712f95a84504'
      and lower(coalesce(prenom, '')) = 'test'
      and lower(coalesce(nom, '')) = 'supabase'
  ) then
    raise exception 'TEST_SUPABASE_NOT_FOUND_OR_MISMATCH';
  end if;

  if not exists (
    select 1
    from public.trainers
    where id = 'f4c3ff6b-91c8-41ad-864c-de0abdb07080'
      and lower(coalesce(prenom, '')) = 'test'
      and lower(coalesce(nom, '')) = 'revendication'
      and lower(coalesce(email, '')) = 'contact@alter-prevention.com'
  ) then
    raise exception 'TEST_REVENDICATION_NOT_FOUND_OR_MISMATCH';
  end if;

  if not exists (
    select 1
    from public.trainers
    where id = '7f469fc6-9b96-40fe-9e54-cc385031ad8f'
      and lower(coalesce(prenom, '')) = 'test'
      and lower(coalesce(nom, '')) = 'nouveau profil'
      and lower(coalesce(email, '')) = 'sandymmo@alter-prevention.com'
  ) then
    raise exception 'TEST_NOUVEAU_PROFIL_NOT_FOUND_OR_MISMATCH';
  end if;
end;
$$;


-- ----------------------------------------------------------
-- 2. Supprimer les fiches formateurs de test
-- ----------------------------------------------------------

delete from public.trainers
where id in (
  '4414cc35-b534-48bb-8267-712f95a84504',
  'f4c3ff6b-91c8-41ad-864c-de0abdb07080',
  '7f469fc6-9b96-40fe-9e54-cc385031ad8f'
);


-- ----------------------------------------------------------
-- 3. Supprimer les comptes Auth de test
-- ----------------------------------------------------------
--
-- profiles et organization_members sont liés à auth.users
-- avec ON DELETE CASCADE.
-- ----------------------------------------------------------

delete from auth.users
where id in (
  'db12672f-d9ad-4851-ba31-db7c576f263b',
  '921edfc8-803a-42db-afef-b9a9fd31710f'
);

commit;
