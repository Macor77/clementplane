-- Run ONLY on documentation-demo (jqhbrkyeawtsuzrzrnvm), never production.
-- All fictitious rows and effects are rolled back. No external service calls.
begin;
insert into auth.users(id,raw_user_meta_data) values
('aaa15000-0000-4000-8000-000000000001','{}'),('aaa15000-0000-4000-8000-000000000002','{}'),('aaa15000-0000-4000-8000-000000000003','{}'),('aaa15000-0000-4000-8000-000000000004','{}');
insert into public.trainers(id,user_id,prenom,nom) values ('aaa15000-0000-4000-8000-000000000011','aaa15000-0000-4000-8000-000000000001','Alex','Fictif'),('aaa15000-0000-4000-8000-000000000012','aaa15000-0000-4000-8000-000000000002','Sam','Fictif');
insert into public.organizations(id,name,slug) values ('aaa15000-0000-4000-8000-000000000021','OF Fictif V150','test-v150-aaa15000'),('aaa15000-0000-4000-8000-000000000022','Autre OF Fictif V150','test-v150-other-aaa15000');
insert into public.organization_members(organization_id,user_id,role,status) values ('aaa15000-0000-4000-8000-000000000021','aaa15000-0000-4000-8000-000000000003','owner','active'),('aaa15000-0000-4000-8000-000000000022','aaa15000-0000-4000-8000-000000000004','owner','active');
insert into public.missions(id,organization_id,formation,lieu,cout_formateur) values ('aaa15000-0000-4000-8000-000000000031','aaa15000-0000-4000-8000-000000000021','Formation fictive','Centre fictif',700);
insert into public.mission_formateurs(mission_id,formateur_id,statut) values ('aaa15000-0000-4000-8000-000000000031','aaa15000-0000-4000-8000-000000000011','affecte');
insert into public.mission_dates(mission_id,date) values ('aaa15000-0000-4000-8000-000000000031','2026-11-01');
set local role authenticated;
select set_config('request.jwt.claim.sub','aaa15000-0000-4000-8000-000000000001',true);
insert into public.trainer_personal_missions(id,title,formation,dates,postal_code,city,fee,fee_unit) values ('aaa15000-0000-4000-8000-000000000051','Client fictif','SST fictif','[{"date":"2026-11-01"}]','75001','Paris',700,'mission');
do $$declare r jsonb; personal jsonb; k text; v jsonb; payload jsonb:='{"declared_fee":650,"tax_basis":"HT","observations":"PARTAGE FICTIF","expense_items":[{"id":"aaa15000-0000-4000-8000-000000000901","category":"meals","amount_cents":10,"details":"DEPENSE PRIVEE FICTIVE"},{"id":"aaa15000-0000-4000-8000-000000000902","category":"meals","amount_cents":20,"details":""}],"kilometers":42.5,"difficulties":"SECRET FICTIF","partial_attendance":[{"id":"aaa15000-0000-4000-8000-000000000801","learner_count":1,"actual_days":null,"actual_hours":1},{"id":"aaa15000-0000-4000-8000-000000000802","learner_count":3,"actual_days":0.5,"actual_hours":3}],"summary":{"status":"done","learner_count":10,"actual_days":0.5,"actual_hours":3}}';begin
r:=public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',null,'aaa15000-0000-4000-8000-000000000071',payload);
if (r->'report'->'agreed_fee'->>'amount')::numeric<>700 or (r->'private'->>'kilometers')::numeric<>42.5 then raise exception 'INVALID_SAVED_REPORT'; end if;
if r->'report'->'partial_attendance' is distinct from payload->'partial_attendance' or (r->'report'->'summary'->>'learner_count')::int<>10 then raise exception 'INVALID_PARTIAL_SAVE'; end if;
begin
perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000079',payload-'partial_attendance');
raise exception 'OLD_PARTIAL_CLIENT_ACCEPTED'; exception when others then if sqlerrm<>'REPORT_APP_UPDATE_REQUIRED' then raise; end if; end;
begin
perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000079',jsonb_set(payload,'{summary,learner_count}','3'));
raise exception 'PARTIAL_OVER_TOTAL_ACCEPTED'; exception when others then if sqlerrm<>'PARTIAL_ATTENDANCE_EXCEEDS_TOTAL' then raise; end if; end;
if (r->'private'->>'expenses')::numeric<>0.30 or jsonb_array_length(r->'private'->'expense_items')<>2 then raise exception 'WRONG_EXPENSE_TOTAL'; end if;
if (r->'report')::text like '%SECRET%' or (r->'report')::text like '%DEPENSE%' then raise exception 'PRIVATE_LEAK'; end if;
if public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',null,'aaa15000-0000-4000-8000-000000000071',payload) is distinct from r then raise exception 'RETRY_NOT_IDEMPOTENT'; end if;
personal:=public.save_trainer_activity_report('personal','aaa15000-0000-4000-8000-000000000051',null,'aaa15000-0000-4000-8000-000000000072',payload);
if personal->'report'->'agreed_fee'->>'tax_basis'<>'HT' then raise exception 'INVALID_PERSONAL_FEE'; end if;
if r->'report'->>'trainer_name'<>'Alex Fictif' then raise exception 'INVALID_AUTHOR'; end if;
if r->'report'->>'formation_title'<>'Formation fictive' or r->'report'->>'activity_date'<>'2026-11-01' or (r->'report'->'summary'->>'actual_days')::numeric<>0.5 then raise exception 'INVALID_SIMPLE_REPORT'; end if;
begin
perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000075',payload||'{"formation_title":"Forged"}'::jsonb);
raise exception 'FORGED_TITLE_ACCEPTED'; exception when others then if sqlerrm<>'INVALID_REPORT_FIELDS' then raise; end if; end;
begin
perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000075',(payload-'summary')||'{"sessions":[]}'::jsonb);
raise exception 'OLD_CLIENT_ACCEPTED'; exception when others then if sqlerrm<>'REPORT_APP_UPDATE_REQUIRED' then raise; end if; end;

begin
perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000076',payload-'expense_items');
raise exception 'OLD_EXPENSE_CLIENT_ACCEPTED'; exception when others then if sqlerrm<>'REPORT_APP_UPDATE_REQUIRED' then raise; end if; end;
for v in select value from jsonb_array_elements('[-1,1.2,"10",null,10000000000]'::jsonb) loop
begin
perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000076',jsonb_set(payload,'{expense_items,0,amount_cents}',v));
raise exception 'INVALID_CENTS_ACCEPTED'; exception when others then if sqlerrm not in ('INVALID_EXPENSE_AMOUNT','EXPENSE_AMOUNT_REQUIRED') then raise; end if; end;
end loop;
begin
perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000076',payload||'{"expenses":0}'::jsonb);
raise exception 'FORGED_TOTAL_ACCEPTED'; exception when others then if sqlerrm<>'INVALID_REPORT_FIELDS' then raise; end if; end;

foreach k in array array['declared_fee','kilometers'] loop
  for v in select value from jsonb_array_elements('[-0.001,1.234,"1.20"]'::jsonb) loop
    begin
      perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000074',jsonb_set(payload,array[k],v));
      raise exception 'INVALID_AMOUNT_ACCEPTED';
    exception when others then if sqlerrm<>'INVALID_AMOUNT' then raise; end if; end;
  end loop;
end loop;
r:=public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000080',payload||'{"observations":"Corrigé"}'::jsonb);
if r->'report'->'partial_attendance' is distinct from payload->'partial_attendance' or (r->'private'->>'expenses')::numeric<>0.30 then raise exception 'UNRELATED_EDIT_LOST_DATA'; end if;
r:=public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',2,'aaa15000-0000-4000-8000-000000000081',payload||'{"partial_attendance":[]}'::jsonb);
if r->'report'->'partial_attendance'<>'[]'::jsonb then raise exception 'PARTIAL_DELETE_FAILED'; end if;
r:=public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',3,'aaa15000-0000-4000-8000-000000000082',payload);
end $$;
select set_config('request.jwt.claim.sub','aaa15000-0000-4000-8000-000000000003',true);
do $$begin
if (select count(*) from public.trainer_activity_reports where mission_id='aaa15000-0000-4000-8000-000000000031')<>1 then raise exception 'OF_SHARED_ACCESS'; end if;
if (select jsonb_array_length(partial_attendance) from public.trainer_activity_reports where mission_id='aaa15000-0000-4000-8000-000000000031')<>2 then raise exception 'OF_PARTIAL_READ_FAILED'; end if;
if exists(select 1 from public.trainer_activity_reports where personal_mission_id='aaa15000-0000-4000-8000-000000000051') or exists(select 1 from public.trainer_activity_private where owner_user_id='aaa15000-0000-4000-8000-000000000001') then raise exception 'OF_PRIVATE_LEAK'; end if;
begin perform public.save_trainer_activity_report('organization','aaa15000-0000-4000-8000-000000000031',1,'aaa15000-0000-4000-8000-000000000073','{}'); raise exception 'OF_WRITE_ALLOWED'; exception when others then if sqlerrm<>'REPORT_ACCESS_DENIED' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','aaa15000-0000-4000-8000-000000000004',true);
do $$begin if exists(select 1 from public.trainer_activity_reports where mission_id='aaa15000-0000-4000-8000-000000000031') then raise exception 'OTHER_OF_LEAK'; end if; end $$;
select set_config('request.jwt.claim.sub','aaa15000-0000-4000-8000-000000000002',true);
do $$begin if exists(select 1 from public.trainer_activity_reports where mission_id='aaa15000-0000-4000-8000-000000000031') then raise exception 'OTHER_TRAINER_LEAK'; end if; end $$;
reset role;
do $$begin
if exists(select 1 from pg_trigger where tgrelid in ('public.trainer_activity_reports'::regclass,'public.trainer_activity_private'::regclass) and not tgisinternal) then raise exception 'UNEXPECTED_ACTIVITY_TRIGGER'; end if;
if (select cout_formateur from public.missions where id='aaa15000-0000-4000-8000-000000000031')<>700 then raise exception 'CONTRACT_CHANGED'; end if;
end $$;
rollback;
select 'PASS: hosted partial attendance subset/save/edit/delete/retry/old-client/OF read-only/private expenses and RLS; all fictitious data rolled back' as result;
