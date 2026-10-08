-- The trusted server role bypasses RLS, but BYPASSRLS does not grant SELECT or
-- EXECUTE. Older isolated schemas lack these grants. Keep the source snapshot
-- SECURITY INVOKER and grant only its required columns and existing read RPCs.
-- No browser role, credential, write privilege or business row is changed.
grant select (id,user_id) on public.trainers to service_role;
grant select (id,statut,adresse) on public.missions to service_role;
grant execute on function public.get_my_mission_proposals(),
 public.get_my_pending_mission_change(uuid),
 public.get_my_mission_organization_contact(uuid) to service_role;
