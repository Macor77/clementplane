create role authenticated;create role anon;create role service_role bypassrls;create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table auth.users(id uuid primary key);create table trainers(id uuid primary key,user_id uuid,prenom text,nom text);
create table profiles(id uuid primary key,first_name text,last_name text,email text);
create table missions(id uuid primary key,statut text,adresse text);create table mission_dates(mission_id uuid,date date);
create table mission_formateurs(id uuid primary key,mission_id uuid,formateur_id uuid,statut text);
create table mission_change_requests(id uuid primary key,mission_id uuid);create table mission_change_request_trainers(id uuid primary key,trainer_id uuid,change_request_id uuid);
create table trainer_personal_missions(id uuid primary key,owner_user_id uuid,trainer_id uuid,title text,formation text,client_name text,site_name text,address text,postal_code text,city text,location text,dates jsonb,fee numeric,fee_unit text,private_notes text,status text);
create function get_my_mission_proposals() returns table(mission_id uuid,status text) language sql as $$ select id,'affecte' from public.missions where false $$;
create function get_my_pending_mission_change(uuid) returns table(request_id uuid) language sql as $$select null::uuid where false$$;
create function get_my_mission_organization_contact(uuid) returns table(contact_name text,contact_email text,contact_phone text) language sql as $$select null::text,null::text,null::text where false$$;
-- Reproduce the older demo schema: service_role bypasses RLS but does not
-- automatically inherit table privileges or the trainer RPC grants.
grant usage on schema auth to service_role;
grant select on public.trainer_personal_missions to service_role;
grant execute on function auth.uid() to service_role;
revoke execute on function get_my_mission_proposals(),get_my_pending_mission_change(uuid),get_my_mission_organization_contact(uuid) from public;
insert into auth.users values ('20000000-0000-0000-0000-000000000001'),('20000000-0000-0000-0000-000000000002');
insert into trainers(id,user_id) values ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001');