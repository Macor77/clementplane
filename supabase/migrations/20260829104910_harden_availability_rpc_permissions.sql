-- Durcissement des droits d'exécution des fonctions de disponibilités.
revoke all on function public.get_organization_trainer_availability(uuid, uuid[], date, date) from public;
revoke all on function public.get_organization_trainer_availability(uuid, uuid[], date, date) from anon;
grant execute on function public.get_organization_trainer_availability(uuid, uuid[], date, date) to authenticated;
grant execute on function public.get_organization_trainer_availability(uuid, uuid[], date, date) to service_role;

revoke all on function public.log_organization_trainer_availability_change() from public;
revoke all on function public.log_organization_trainer_availability_change() from anon;
revoke all on function public.log_organization_trainer_availability_change() from authenticated;
revoke all on function public.log_organization_trainer_availability_change() from service_role;
