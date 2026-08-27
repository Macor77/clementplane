-- ==========================================================
-- SPRINT 10.2 — DURCISSEMENT DES DROITS organization_trainers
-- ==========================================================
--
-- La RLS est déjà correctement définie par organisation.
-- Cette migration applique le principe du moindre privilège :
-- - aucun accès direct pour anon ;
-- - authenticated conserve uniquement les opérations métier
--   nécessaires, toujours filtrées par les politiques RLS.
-- ==========================================================

alter table public.organization_trainers
enable row level security;

-- Aucun accès direct anonyme à la relation privée OF / formateur.
revoke all
on table public.organization_trainers
from anon;

-- Réduire les droits authenticated aux opérations réellement utiles.
revoke all
on table public.organization_trainers
from authenticated;

grant select, insert, update, delete
on table public.organization_trainers
to authenticated;

-- service_role conserve ses droits d'administration backend.
