-- Run ONLY on documentation-demo (jqhbrkyeawtsuzrzrnvm), never production.
-- All fictitious rows and effects are rolled back. No external service calls.
begin;
insert into auth.users(id,raw_user_meta_data) values
('aaa13000-0000-4000-8000-000000000001','{}'),('aaa13000-0000-4000-8000-000000000002','{}'),('aaa13000-0000-4000-8000-000000000003','{}'),('aaa13000-0000-4000-8000-000000000004','{}');
insert into public.trainers(id,user_id,prenom,nom) values ('aaa13000-0000-4000-8000-000000000011','aaa13000-0000-4000-8000-000000000001','Alex','Fictif'),('aaa13000-0000-4000-8000-000000000012','aaa13000-0000-4000-8000-000000000002','Sam','Fictif');
insert into public.organizations(id,name,slug) values ('aaa13000-0000-4000-8000-000000000021','OF Fictif V13','test-v13-aaa13000'),('aaa13000-0000-4000-8000-000000000022','Autre OF Fictif V13','test-v13-other-aaa13000');
insert into public.organization_members(organization_id,user_id,role,status) values ('aaa13000-0000-4000-8000-000000000021','aaa13000-0000-4000-8000-000000000003','owner','active'),('aaa13000-0000-4000-8000-000000000022','aaa13000-0000-4000-8000-000000000004','owner','active');
insert into public.missions(id,organization_id,formation,lieu,cout_formateur) values ('aaa13000-0000-4000-8000-000000000031','aaa13000-0000-4000-8000-000000000021','Formation fictive','Centre fictif',700);
insert into public.mission_formateurs(mission_id,formateur_id,statut) values ('aaa13000-0000-4000-8000-000000000031','aaa13000-0000-4000-8000-000000000011','affecte');
set local role authenticated;
select set_config('request.jwt.claim.sub','aaa13000-0000-4000-8000-000000000001',true);
insert into public.trainer_personal_missions(id,title,formation,dates,postal_code,city,fee,fee_unit) values ('aaa13000-0000-4000-8000-000000000051','Client fictif','SST fictif','[{"date":"2026-11-01"}]','75001','Paris',700,'mission');
do $$declare r jsonb; personal jsonb; payload jsonb:='{"declared_fee":650,"tax_basis":"HT","observations":"PARTAGE FICTIF","expenses":0,"expense_details":"DEPENSE PRIVEE FICTIVE","kilometers":42.5,"difficulties":"SECRET FICTIF","sessions":[{"id":"aaa13000-0000-4000-8000-000000000061","formation":"SST fictif","group_label":"Matin","learner_count":10,"expected_learners":null,"days":[{"date":"2026-11-01","status":"done","actual_hours":7,"planned_hours":null},{"date":"2026-11-02","status":"pending","actual_hours":null,"planned_hours":7}]}]}';begin
r:=public.save_trainer_activity_report('organization','aaa13000-0000-4000-8000-000000000031',null,'aaa13000-0000-4000-8000-000000000071',payload);
if (r->'report'->'agreed_fee'->>'amount')::numeric<>700 or (r->'private'->>'kilometers')::numeric<>42.5 then raise exception 'INVALID_SAVED_REPORT'; end if;
if (r->'report')::text like '%SECRET%' or (r->'report')::text like '%DEPENSE%' then raise exception 'PRIVATE_LEAK'; end if;
if public.save_trainer_activity_report('organization','aaa13000-0000-4000-8000-000000000031',null,'aaa13000-0000-4000-8000-000000000071',payload) is distinct from r then raise exception 'RETRY_NOT_IDEMPOTENT'; end if;
personal:=public.save_trainer_activity_report('personal','aaa13000-0000-4000-8000-000000000051',null,'aaa13000-0000-4000-8000-000000000072',payload);
if personal->'report'->'agreed_fee'->>'tax_basis'<>'HT' then raise exception 'INVALID_PERSONAL_FEE'; end if;
end $$;
select set_config('request.jwt.claim.sub','aaa13000-0000-4000-8000-000000000003',true);
do $$begin
if (select count(*) from public.trainer_activity_reports where mission_id='aaa13000-0000-4000-8000-000000000031')<>1 then raise exception 'OF_SHARED_ACCESS'; end if;
if exists(select 1 from public.trainer_activity_reports where personal_mission_id='aaa13000-0000-4000-8000-000000000051') or exists(select 1 from public.trainer_activity_private where owner_user_id='aaa13000-0000-4000-8000-000000000001') then raise exception 'OF_PRIVATE_LEAK'; end if;
begin perform public.save_trainer_activity_report('organization','aaa13000-0000-4000-8000-000000000031',1,'aaa13000-0000-4000-8000-000000000073','{}'); raise exception 'OF_WRITE_ALLOWED'; exception when others then if sqlerrm<>'REPORT_ACCESS_DENIED' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','aaa13000-0000-4000-8000-000000000004',true);
do $$begin if exists(select 1 from public.trainer_activity_reports where mission_id='aaa13000-0000-4000-8000-000000000031') then raise exception 'OTHER_OF_LEAK'; end if; end $$;
select set_config('request.jwt.claim.sub','aaa13000-0000-4000-8000-000000000002',true);
do $$begin if exists(select 1 from public.trainer_activity_reports where mission_id='aaa13000-0000-4000-8000-000000000031') then raise exception 'OTHER_TRAINER_LEAK'; end if; end $$;
reset role;
do $$begin
if exists(select 1 from pg_trigger where tgrelid in ('public.trainer_activity_reports'::regclass,'public.trainer_activity_private'::regclass) and not tgisinternal) then raise exception 'UNEXPECTED_ACTIVITY_TRIGGER'; end if;
if (select cout_formateur from public.missions where id='aaa13000-0000-4000-8000-000000000031')<>700 then raise exception 'CONTRACT_CHANGED'; end if;
end $$;
rollback;
select 'PASS: hosted PostgreSQL demo, owner saves/retries, personal privacy, OF read-only, other OF/trainer denied; all fictitious data rolled back' as result;
