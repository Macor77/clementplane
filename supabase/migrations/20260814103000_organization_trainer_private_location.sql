-- ==========================================================
-- SPRINT 10.1.4A
-- LOCALISATION PRIVÉE PAR ORGANISME
-- ==========================================================
--
-- Principe :
--
-- Profil NON revendiqué :
-- chaque OF possède sa propre localisation du formateur
-- dans organization_trainers.
--
-- Profil revendiqué :
-- la localisation globale de trainers devient la référence.
--
-- Cette migration ajoute uniquement les nouvelles colonnes
-- et initialise les relations existantes.
-- Aucun ancien champ n'est supprimé.
-- ==========================================================


-- ----------------------------------------------------------
-- 1. Nouvelles colonnes privées OF
-- ----------------------------------------------------------

alter table public.organization_trainers
  add column if not exists ville text,
  add column if not exists code_postal text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;


-- ----------------------------------------------------------
-- 2. Migration des données existantes
-- ----------------------------------------------------------
--
-- Pour les profils NON revendiqués uniquement :
-- la localisation actuellement présente dans trainers
-- est copiée dans chaque relation OF / formateur existante.
--
-- Cela permet de conserver le comportement actuel pendant
-- la transition vers le nouveau modèle.
--
-- IMPORTANT :
-- les profils revendiqués ne sont pas concernés.
-- Leur localisation trainers reste leur référence globale.
-- ----------------------------------------------------------

update public.organization_trainers ot
set
  ville = t.ville,
  code_postal = t.code_postal,
  latitude = t.latitude,
  longitude = t.longitude
from public.trainers t
where
  t.id = ot.trainer_id
  and t.user_id is null
  and (
    ot.ville is null
    or ot.code_postal is null
    or ot.latitude is null
    or ot.longitude is null
  );


-- ----------------------------------------------------------
-- 3. Index
-- ----------------------------------------------------------
--
-- Préparation des futurs usages géographiques.
-- ----------------------------------------------------------

create index if not exists
  organization_trainers_location_idx
on public.organization_trainers (
  organization_id,
  code_postal,
  ville
);