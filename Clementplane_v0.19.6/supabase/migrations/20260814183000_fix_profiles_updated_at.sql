-- ==========================================================
-- SPRINT 10.4A — CORRECTION profiles.updated_at
-- ==========================================================
--
-- La table profiles existait déjà avant la migration qui utilisait
-- CREATE TABLE IF NOT EXISTS. La colonne updated_at n'a donc jamais
-- été ajoutée sur la base distante, alors que le trigger
-- profiles_set_updated_at tente de l'écrire à chaque UPDATE.
-- ==========================================================

alter table public.profiles
add column if not exists updated_at timestamptz not null default now();

-- Réinitialise la valeur sur les anciennes lignes si nécessaire.
update public.profiles
set updated_at = coalesce(updated_at, now());

