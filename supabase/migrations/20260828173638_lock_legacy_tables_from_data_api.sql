-- Clementplane — Pré-lancement
-- Neutralisation des anciennes tables legacy côté Data API.
-- Aucune donnée supprimée. Aucune règle métier modifiée.

revoke all privileges
on table
  public.formateurs,
  public.organismes,
  public.organisme_formateurs
from anon, authenticated;

-- Défense supplémentaire : retirer aussi les droits hérités via PUBLIC.
revoke all privileges
on table
  public.formateurs,
  public.organismes,
  public.organisme_formateurs
from public;
