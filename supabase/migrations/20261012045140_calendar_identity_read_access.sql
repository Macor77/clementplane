-- Calendar identity is display metadata only. Keep these reads column-scoped
-- for the trusted server role; do not widen browser access or grant writes.
grant select (id,first_name,last_name) on public.profiles to service_role;
grant select (prenom,nom) on public.trainers to service_role;
