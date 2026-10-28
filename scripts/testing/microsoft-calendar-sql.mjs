import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role authenticated;create role anon;create role service_role bypassrls;create schema auth;
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
insert into trainers(id,user_id) values ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001');`);
await db.exec(fs.readFileSync('supabase/migrations/20261008054625_google_calendar_sync.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20261008072003_google_calendar_service_read_access.sql','utf8'));
assert.equal((await db.query("select has_table_privilege('service_role','missions','UPDATE') as allowed")).rows[0].allowed,false,'Source read grant must not allow writes');
assert.equal((await db.query("select has_table_privilege('service_role','trainers','SELECT') as allowed")).rows[0].allowed,false,'Trainer grant remains column-specific');
await db.exec(fs.readFileSync('supabase/migrations/20261012045140_calendar_identity_read_access.sql','utf8'));
assert.equal((await db.query("select has_column_privilege('service_role','profiles','first_name','SELECT') as allowed")).rows[0].allowed,true,'Worker can read first name');
assert.equal((await db.query("select has_column_privilege('service_role','profiles','email','SELECT') as allowed")).rows[0].allowed,false,'Identity grant does not expose email');
assert.equal((await db.query("select has_table_privilege('service_role','profiles','UPDATE') as allowed")).rows[0].allowed,false,'Identity grant does not allow writes');
assert.equal((await db.query("select has_column_privilege('anon','profiles','first_name','SELECT') as allowed")).rows[0].allowed,false,'Identity grant does not widen browser access');
await db.exec(fs.readFileSync('supabase/migrations/20261028065329_microsoft_calendar_sync.sql','utf8'));
const uid='20000000-0000-0000-0000-000000000001';
await db.exec(`insert into microsoft_calendar_connections(user_id,status,token_ciphertext) values ('${uid}','active','encrypted');`);
await db.exec("update microsoft_calendar_connections set calendar_id='dedicated',calendar_pending=false");
const cid=(await db.query('select id from microsoft_calendar_connections')).rows[0].id;
for(const role of ['anon','authenticated']){
 await db.exec(`set role ${role}`);
 for(const table of ['microsoft_calendar_connections','microsoft_calendar_oauth_states','microsoft_calendar_events'])await assert.rejects(()=>db.query(`select * from ${table}`));
 await assert.rejects(()=>db.query('select * from microsoft_calendar_claim()'));
 await assert.rejects(()=>db.query(`select calendar_source_snapshot('${uid}')`));
 await db.exec('reset role');
}
await db.exec('set role service_role');
assert.equal((await db.query('select * from microsoft_calendar_claim(ARRAY[]::uuid[])')).rows.length,0,'Testing mode excludes users outside allowlist');
const first=(await db.query('select * from microsoft_calendar_claim()')).rows[0];assert.equal(first.id,cid);assert.ok(first.lock_id);assert.ok(first.cycle_id);
assert.equal((await db.query('select * from microsoft_calendar_claim()')).rows.length,0,'Exclusive claim');
assert.equal((await db.query(`select * from microsoft_calendar_lock('${uid}')`)).rows.length,0,'Control cannot overlap worker');
assert.equal((await db.query(`select microsoft_calendar_finish('${cid}','00000000-0000-0000-0000-000000000000',1,'active',null,60) as ok`)).rows[0].ok,false,'Stale worker cannot finish');
await db.exec('reset role');
await db.exec(`insert into trainer_personal_missions(id,owner_user_id,trainer_id,title,status,dates) values ('40000000-0000-0000-0000-000000000001','${uid}','10000000-0000-0000-0000-000000000001','DEMO','confirmed','[{"date":"2026-10-25"}]')`);
const dirty=(await db.query('select dirty_version,cycle_id from microsoft_calendar_connections')).rows[0];assert.ok(Number(dirty.dirty_version)>Number(first.dirty_version));assert.equal(dirty.cycle_id,null);
assert.equal((await db.query('select count(*)::int n from calendar_connections')).rows[0].n,0,'Microsoft does not create Google connections');
await db.exec('set role service_role');
const snapshot=(await db.query(`select calendar_source_snapshot('${uid}') as rows`)).rows[0].rows;assert.equal(snapshot.length,1);assert.equal(snapshot[0].title,'DEMO');assert.equal(snapshot[0].owner_user_id,undefined);
assert.deepEqual((await db.query("select calendar_source_snapshot('20000000-0000-0000-0000-000000000002') as rows")).rows[0].rows,[]);
await db.exec('reset role');
assert.equal((await db.query("select count(*)::int n from pg_class where relname in ('microsoft_calendar_connections','microsoft_calendar_oauth_states','microsoft_calendar_events') and relrowsecurity")).rows[0].n,3);
await db.exec(`delete from auth.users where id='${uid}'`);assert.equal((await db.query('select count(*)::int n from microsoft_calendar_connections')).rows[0].n,0);
// Vault is a test-only stand-in. Never use real worker keys in tests.
await db.exec(`create schema vault;create table vault.decrypted_secrets(name text,decrypted_secret text);`);
await db.exec(fs.readFileSync('supabase/migrations/20261028160000_microsoft_calendar_worker_vault_auth.sql','utf8'));
const workerKey='a'.repeat(64);
await db.query('insert into vault.decrypted_secrets values ($1,$2)',['microsoft_calendar_worker_secret',workerKey]);
for(const role of ['anon','authenticated']){
 await db.exec(`set role ${role}`);
 await assert.rejects(()=>db.query('select public.microsoft_calendar_authorize_worker($1)',[workerKey]));
 await db.exec('reset role');
}
await db.exec('set role service_role');
await assert.rejects(()=>db.query('select * from vault.decrypted_secrets'));
for(const [key,expected] of [[workerKey,true],['b'.repeat(64),false],['short',false],[null,false]]){
 assert.equal((await db.query('select public.microsoft_calendar_authorize_worker($1) as ok',[key])).rows[0].ok,expected);
}
await db.exec('reset role');
await db.query('insert into vault.decrypted_secrets values ($1,$2)',['microsoft_calendar_worker_secret',workerKey]);
assert.equal((await db.query('select public.microsoft_calendar_authorize_worker($1) as ok',[workerKey])).rows[0].ok,false,'Duplicate Vault keys fail closed');
await db.exec('delete from vault.decrypted_secrets');
assert.equal((await db.query('select public.microsoft_calendar_authorize_worker($1) as ok',[workerKey])).rows[0].ok,false,'Missing Vault key fails closed');
await db.close();console.log('PASS Microsoft calendar SQL: grants/RLS, service-only RPCs, exclusive claim/control, stale finish, dirty trigger, source isolation, account erasure.');

