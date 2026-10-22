import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
let db;
const read = p => readFileSync(p,'utf8');
const uid='20000000-0000-0000-0000-000000000001';
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table email_logs(id uuid primary key,sent_at timestamptz,delivered_at timestamptz,provider_message_id text);
 create table trainers(id uuid primary key,user_id uuid);
 create table mission_formateurs(id uuid primary key,mission_id uuid,formateur_id uuid references trainers(id),statut text,proposal_token uuid,proposal_expires_at timestamptz,repondu_le timestamptz,response_comment text,commentaire text,affecte_le timestamptz);
 grant select on email_logs to service_role;
 insert into trainers values ('10000000-0000-0000-0000-000000000001','${uid}');`);
 await db.exec(read('supabase/migrations/20260828081027_secure_mission_proposal_null_expiration.sql'));
 const old=read('supabase/migrations/20260817153000_fix_mission_history_actor_context.sql');
 await db.exec(old.slice(old.indexOf('create or replace function public.respond_to_my_mission_proposal('),old.indexOf('create or replace function public.respond_to_mission_proposal(')));
 await db.exec(read('supabase/migrations/20261022061649_mission_response_outbox.sql'));
},30000);
afterAll(async()=>{await db?.close()});
it('queues accepted and refused replies from both real RPC paths without a browser notification call',async()=>{
 expect((await db.query("select to_regclass('public.mission_response_outbox') as name")).rows[0].name).toBe('mission_response_outbox');
 for (const [i,connected,response] of [[1,false,'accepte'],[2,false,'refuse'],[3,true,'accepte'],[4,true,'refuse']]) {
 const id=`30000000-0000-0000-0000-00000000000${i}`;
 await db.exec(`insert into mission_formateurs(id,formateur_id,statut,proposal_token,proposal_expires_at) values('${id}','10000000-0000-0000-0000-000000000001','proposition_envoyee','${id}',now()+interval '1 day');
 set request.jwt.claim.sub='${connected?uid:''}';set role ${connected?'authenticated':'anon'};`);
 await db.query(connected?'select respond_to_my_mission_proposal($1,$2,$3)':'select respond_to_mission_proposal($1,$2,$3)',[id,response,'Merci']);
 await db.exec('reset role');
 const job=(await db.query('select * from mission_response_outbox where relation_id=$1',[id])).rows[0];
 expect(job.response).toBe(response);expect(job.status).toBe('pending');
 await db.exec(`update mission_formateurs set commentaire='other' where id='${id}'`);
 expect((await db.query('select count(*)::int n from mission_response_outbox where relation_id=$1',[id])).rows[0].n).toBe(1);
 }
});
it('protects jobs and worker RPCs from both browser roles',async()=>{
 for(const role of ['anon','authenticated']){
 await db.exec(`set role ${role}`);
 await expect(db.query('select * from mission_response_outbox')).rejects.toThrow();
 await expect(db.query('select * from claim_mission_response()')).rejects.toThrow();
 await db.exec('reset role');
 }
});
it('claims exclusively, fences stale workers and quarantines uncertain sends instead of duplicating',async()=>{
 await db.exec('set role service_role');
 const j=(await db.query('select * from claim_mission_response()')).rows[0];expect(j).toBeTruthy();
 const second=(await db.query('select * from claim_mission_response()')).rows[0];expect(second.id).not.toBe(j.id);
 expect((await db.query('select start_mission_response_send($1,$2) ok',[j.id,'00000000-0000-0000-0000-000000000000'])).rows[0].ok).toBe(false);
 expect((await db.query('select start_mission_response_send($1,$2) ok',[j.id,j.lock_id])).rows[0].ok).toBe(true);
 await db.exec('reset role');
 await db.query("update mission_response_outbox set locked_at=now()-interval '10 minutes' where id=$1",[j.id]);
 await db.query('select * from claim_mission_response()');
 expect((await db.query('select status from mission_response_outbox where id=$1',[j.id])).rows[0].status).toBe('uncertain');
});
it('reconciles webhook delivery without another provider attempt',async()=>{
 const j=(await db.query("select * from mission_response_outbox where status='uncertain' limit 1")).rows[0];
 await db.query('insert into email_logs(id,delivered_at) values($1,now())',[j.id]);
 await db.query('select * from claim_mission_response()');
 expect((await db.query('select status from mission_response_outbox where id=$1',[j.id])).rows[0].status).toBe('sent');
});
it('rolls back the queued job with the business transaction and creates a fresh job for a new reply',async()=>{
 const id='30000000-0000-0000-0000-000000000001';
 const before=(await db.query('select count(*)::int n from mission_response_outbox')).rows[0].n;
 await db.exec(`begin;update mission_formateurs set statut='refuse',repondu_le=now()+interval '1 second' where id='${id}';rollback;`);
 expect((await db.query('select count(*)::int n from mission_response_outbox')).rows[0].n).toBe(before);
 await db.exec(`update mission_formateurs set statut='refuse',repondu_le=now()+interval '1 second' where id='${id}';`);
 expect((await db.query('select count(*)::int n from mission_response_outbox')).rows[0].n).toBe(before+1);
});
it('caps retry attempts and rejects stale completion',async()=>{
 const j=(await db.query('select * from claim_mission_response()')).rows[0];
 await db.query('update mission_response_outbox set attempts=6 where id=$1',[j.id]);
 expect((await db.query('select finish_mission_response($1,$2,$3,$4,$5) ok',[j.id,j.lock_id,'pending','429',120])).rows[0].ok).toBe(true);
 expect((await db.query('select status from mission_response_outbox where id=$1',[j.id])).rows[0].status).toBe('failed');
 expect((await db.query('select finish_mission_response($1,$2,$3) ok',[j.id,j.lock_id,'sent'])).rows[0].ok).toBe(false);
});
