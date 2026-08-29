-- Sprint 20.5 — verrouillage de la RPC de lecture des disponibilités OF
--
-- La fonction vérifie déjà auth.uid() et l'appartenance à l'organisation.
-- On retire néanmoins explicitement EXECUTE à anon afin qu'un utilisateur
-- non authentifié ne puisse pas appeler cette RPC.

revoke execute on function public.get_organization_trainer_availability(
  uuid, uuid[], date, date
) from anon;
