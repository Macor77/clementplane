-- ==========================================================
-- MINI SPRINT 8.3
-- Correction disponibilités Formateur
--
-- Ajout de l'unicité :
-- un formateur ne peut avoir qu'une seule ligne
-- de disponibilité pour une même journée.
-- ==========================================================

alter table public.trainer_availability
add constraint trainer_availability_trainer_day_unique
unique (trainer_id, day);