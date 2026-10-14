-- Run only on the isolated fictitious-data acceptance environment.
-- Never run on production. All fixture writes are rolled back.
-- The three calendar migrations must already be applied; no source grants here.
begin;
do $guard$ begin
 assert not exists(select 1 from auth.users where email !~ '@[^@]+\.(test|invalid)$'),'Only fictitious test accounts are allowed';
end $guard$;
do $permissions$ begin
 assert has_column_privilege('service_role','public.trainers','id','SELECT'),'Missing trainer id read';
 assert has_column_privilege('service_role','public.trainers','user_id','SELECT'),'Missing trainer owner read';
 assert has_column_privilege('service_role','public.missions','id','SELECT'),'Missing mission id read';
 assert has_column_privilege('service_role','public.missions','statut','SELECT'),'Missing mission status read';
 assert has_column_privilege('service_role','public.missions','adresse','SELECT'),'Missing mission address read';
 assert has_function_privilege('service_role','public.get_my_mission_proposals()','EXECUTE'),'Missing proposals read';
 assert has_function_privilege('service_role','public.get_my_pending_mission_change(uuid)','EXECUTE'),'Missing pending read';
 assert has_function_privilege('service_role','public.get_my_mission_organization_contact(uuid)','EXECUTE'),'Missing contact read';
 assert not has_table_privilege('service_role','public.trainers','SELECT'),'Unexpected whole-table trainer read';
 assert not has_table_privilege('service_role','public.missions','UPDATE'),'Unexpected mission write';
end $permissions$;
create temp table calendar_test_report(check_name text,passed boolean);
grant select,insert on calendar_test_report to service_role;
do $test$
declare r text; u uuid; source jsonb; item jsonb; c public.calendar_connections; claimed public.calendar_connections; before_dirty bigint; oldsub text; oldclaims text; count_users integer:=0;
begin
 assert (select count(*) from public.calendar_connections)=0,'Fresh calendar state expected';
 for r in select unnest(array['anon','authenticated']) loop
  execute format('set local role %I',r);
  begin perform 1 from public.calendar_connections; raise exception 'Calendar table access unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform public.calendar_claim(); raise exception 'Calendar worker RPC unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform public.calendar_source_snapshot(gen_random_uuid()); raise exception 'Snapshot RPC unexpectedly allowed'; exception when insufficient_privilege then null; end;
  execute 'reset role';
 end loop;
 insert into calendar_test_report values ('anonymous_and_authenticated_denied',true);
 execute 'set local role service_role';
 for u in select t.user_id from public.trainers t where t.user_id is not null loop
  oldsub:=current_setting('request.jwt.claim.sub',true);oldclaims:=current_setting('request.jwt.claims',true);
  source:=public.calendar_source_snapshot(u);
  assert jsonb_typeof(source)='array','Source must be an array';
  assert coalesce(current_setting('request.jwt.claim.sub',true),'')=coalesce(oldsub,''),'JWT subject not restored';
  assert coalesce(current_setting('request.jwt.claims',true),'')=coalesce(oldclaims,''),'JWT claims not restored';
  for item in select value from jsonb_array_elements(source) loop
   if item->>'origin'='personal' then
    assert exists(select 1 from public.trainer_personal_missions p where p.id=(item->>'mission_id')::uuid and p.owner_user_id=u),'Foreign personal mission in snapshot';
   elsif item->>'origin'='organization' then
    perform set_config('request.jwt.claim.sub',u::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
    assert exists(select 1 from public.get_my_mission_proposals() p where p.mission_id=(item->>'mission_id')::uuid),'Foreign organization mission in snapshot';
    perform set_config('request.jwt.claim.sub',coalesce(oldsub,''),true);
    perform set_config('request.jwt.claims',coalesce(oldclaims,''),true);
   else raise exception 'Unexpected source origin'; end if;
  end loop;
  count_users:=count_users+1;
 end loop;
 assert count_users=2,'Expected both fixture trainers';
 assert public.calendar_source_snapshot(gen_random_uuid())='[]'::jsonb,'Unknown user must have no missions';
 insert into calendar_test_report values ('real_source_rpcs_both_trainers',true),('source_owner_isolation',true),('jwt_context_restored',true);
 select t.user_id into u from public.trainers t where exists(select 1 from public.trainer_personal_missions p where p.owner_user_id=t.user_id and p.status='confirmed') order by t.id limit 1;
 insert into public.calendar_connections(user_id,status,token_ciphertext) values(u,'active','TRANSACTION_TEST_NOT_A_GOOGLE_TOKEN') returning * into c;
 select * into claimed from public.calendar_claim();
 assert claimed.id=c.id and claimed.lock_id is not null,'Claim failed';
 assert not exists(select 1 from public.calendar_claim()),'Double claim allowed';
 assert not exists(select 1 from public.calendar_lock(u)),'Control lock overlaps worker';
 assert not public.calendar_finish(c.id,gen_random_uuid(),claimed.dirty_version,'active',null,60),'Wrong lease finished';
 before_dirty:=claimed.dirty_version;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',u::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 update public.trainer_personal_missions set title=title where owner_user_id=u and status='confirmed';
 assert found,'Fixture update failed';
 execute 'reset role';
 execute 'set local role service_role';
 select * into c from public.calendar_connections where id=c.id;
 assert c.dirty_version>before_dirty and c.cycle_id is null,'Business trigger did not enqueue';
 assert public.calendar_finish(c.id,claimed.lock_id,before_dirty,'active',null,60),'Owned live lease should finish';
 select * into c from public.calendar_connections where id=c.id;
 assert c.synced_version<c.dirty_version and c.last_success_at is null and c.due_at<=now(),'Concurrent source edit was lost';
 insert into calendar_test_report values ('exclusive_worker_and_control_lock',true),('foreign_lease_denied',true),('business_trigger_with_authenticated_role',true),('concurrent_dirty_change_preserved',true);
 execute 'reset role';
 assert (select count(*) from pg_class where relname in ('calendar_connections','calendar_events','calendar_oauth_states') and relrowsecurity)=3,'RLS missing';
 assert not has_schema_privilege('authenticated','calendar_private','USAGE'),'Private trigger schema exposed';
 insert into calendar_test_report values ('rls_and_private_trigger_schema',true);
end $test$;
select jsonb_agg(jsonb_build_object('check',check_name,'passed',passed)) as checks from calendar_test_report;
rollback;
