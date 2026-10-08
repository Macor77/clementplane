import {describe,it,expect,vi} from 'vitest';
import {runCalendarJob,createWorkerHandler} from '../../supabase/functions/_shared/calendar/worker.js';
import {seal,randomToken} from '../../supabase/functions/_shared/calendar/crypto.js';
async function fixture({source=[],sourceFailure=false,dirty=false,expired=false,googleStatus=200,googleBody={access_token:'test'}}={}){
 const secret=randomToken();const row={id:'connection-a',user_id:'user-a',status:'active',calendar_id:'cal-a',lock_id:'lease-a',lock_until:new Date(Date.now()+(expired?-1:300000)).toISOString(),dirty_version:1,first_day:'2026-10-08',cycle_id:'cycle-a',token_ciphertext:await seal(JSON.stringify({refresh_token:'fake'}),secret,'user-a'),attempts:0};
 const finish=vi.fn();
 const db={from:()=>{const q={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:[]}),maybeSingle:async()=>({data:{...row,dirty_version:dirty?2:1}})};return q;},rpc:async(name,args)=>{if(name==='calendar_source_snapshot')return sourceFailure?{error:{message:'do not leak'}}:{data:source};if(name==='calendar_finish'){finish(args);return {data:true};}throw new Error(name);}};
 const fetch=vi.fn(async()=>Response.json(googleBody,{status:googleStatus}));
 return {row,db,fetch,finish,env:{CALENDAR_ENCRYPTION_KEY:secret,APP_URL:'https://example.test'}};
}
describe('worker orchestration',()=>{
 it.each([{sourceFailure:true},{source:[{origin:'personal',mission_id:'m',status:'confirmed',dates:[]}]}])('never deletes events when source cannot be read completely: %j',async options=>{
  const f=await fixture(options);await runCalendarJob(f);expect(f.finish).toHaveBeenCalledWith(expect.objectContaining({p_status:'active',p_error:'continuing'}));expect(f.fetch.mock.calls.every(([url])=>!url.includes('/calendar/'))).toBe(true);
 });
 it.each([{dirty:true},{expired:true}])('fences stale workers before contacting Google: %j',async options=>{const f=await fixture(options);await runCalendarJob(f);expect(f.fetch).not.toHaveBeenCalled();});
 it('retries Google outages automatically',async()=>{const f=await fixture({googleStatus:503,googleBody:{}});await runCalendarJob(f);expect(f.finish).toHaveBeenCalledWith(expect.objectContaining({p_status:'active',p_error:'google_temporarily_unavailable'}));});
 it('stops retrying revoked authorization until reconnect',async()=>{const f=await fixture({googleStatus:400,googleBody:{error:'invalid_grant'}});await runCalendarJob(f);expect(f.finish).toHaveBeenCalledWith(expect.objectContaining({p_status:'reconnect',p_error:'authorization_revoked'}));});
 it('cannot run the worker without its dedicated secret',async()=>{const db=new Proxy({},{get(){throw new Error('UNAUTHORIZED_DB_ACCESS');}});const h=createWorkerHandler({db,env:{CALENDAR_WORKER_SECRET:'private-test-secret',GOOGLE_CALENDAR_MODE:'public'},fetch:vi.fn()});expect((await h(new Request('https://edge.test',{method:'POST'}))).status).toBe(401);});
});
