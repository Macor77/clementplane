import {describe,it,expect,vi} from 'vitest';
import {runMicrosoftCalendarJob,createMicrosoftWorkerHandler} from '../../supabase/functions/_shared/calendar/microsoft-worker.js';
import {seal,randomToken} from '../../supabase/functions/_shared/calendar/crypto.js';
async function fixture({source=[],sourceFailure=false,dirty=false,expired=false,googleStatus=200,googleBody={access_token:'test'}}={}){
 const secret=randomToken();const row={id:'connection-a',user_id:'user-a',status:'active',calendar_id:'cal-a',lock_id:'lease-a',lock_until:new Date(Date.now()+(expired?-1:300000)).toISOString(),dirty_version:1,first_day:'2026-10-08',cycle_id:'cycle-a',token_ciphertext:await seal(JSON.stringify({refresh_token:'fake'}),secret,'user-a'),attempts:0};
 const finish=vi.fn();
 const db={from:()=>{const q={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:[]}),maybeSingle:async()=>({data:{...row,dirty_version:dirty?2:1}})};return q;},rpc:async(name,args)=>{if(name==='calendar_source_snapshot')return sourceFailure?{error:{message:'do not leak'}}:{data:source};if(name==='microsoft_calendar_finish'){finish(args);return {data:true};}throw new Error(name);}};
 const fetch=vi.fn(async url=>Response.json(url.includes('/calendars/')?{id:'cal-a',name:'Clementplane',singleValueExtendedProperties:[{id:'String {6e1358d4-6dd1-4a87-aec5-17b0a0f32f09} Name clementplaneOwner',value:'connection-a'}]}:googleBody,{status:googleStatus}));
 return {row,db,fetch,finish,env:{CALENDAR_ENCRYPTION_KEY:secret,MICROSOFT_CLIENT_ID:'c',MICROSOFT_CLIENT_SECRET:'s',APP_URL:'https://example.test'}};
}
describe('worker orchestration',()=>{
 it.each([{sourceFailure:true},{source:[{origin:'personal',mission_id:'m',status:'confirmed',dates:[]}]}])('never deletes events when source cannot be read completely: %j',async options=>{
  const f=await fixture(options);await runMicrosoftCalendarJob(f);expect(f.finish).toHaveBeenCalledWith(expect.objectContaining({p_status:'active',p_error:'continuing'}));expect(f.fetch.mock.calls.every(([url])=>!url.includes('/calendar/'))).toBe(true);
 });
 it.each([{dirty:true},{expired:true}])('fences stale workers before contacting Google: %j',async options=>{const f=await fixture(options);await runMicrosoftCalendarJob(f);expect(f.fetch).not.toHaveBeenCalled();});
 it('retries Google outages automatically',async()=>{const f=await fixture({googleStatus:503,googleBody:{}});await runMicrosoftCalendarJob(f);expect(f.finish).toHaveBeenCalledWith(expect.objectContaining({p_status:'active',p_error:'microsoft_temporarily_unavailable'}));});
 it('stops retrying revoked authorization until reconnect',async()=>{const f=await fixture({googleStatus:400,googleBody:{error:'invalid_grant'}});await runMicrosoftCalendarJob(f);expect(f.finish).toHaveBeenCalledWith(expect.objectContaining({p_status:'reconnect',p_error:'authorization_revoked'}));});
 it('cannot run the worker without its dedicated secret',async()=>{const db=new Proxy({},{get(){throw new Error('UNAUTHORIZED_DB_ACCESS');}});const h=createMicrosoftWorkerHandler({db,env:{MICROSOFT_CALENDAR_WORKER_SECRET:'private-test-secret',MICROSOFT_CALENDAR_MODE:'public'},fetch:vi.fn()});expect((await h(new Request('https://edge.test',{method:'POST'}))).status).toBe(401);});
});

describe('Vault worker authentication',()=>{
 const key='a'.repeat(64);
 const request=(value=key)=>new Request('https://edge.test',{method:'POST',headers:{'X-Calendar-Worker-Secret':value}});
 it('rejects missing or malformed credentials without querying Vault',async()=>{
  const db={rpc:vi.fn()};const h=createMicrosoftWorkerHandler({db,env:{},fetch:vi.fn()});
  expect((await h(request(''))).status).toBe(401);expect((await h(request('short'))).status).toBe(401);expect(db.rpc).not.toHaveBeenCalled();
 });
 it('accepts only a true Vault verification result and returns no secret',async()=>{
  const db={rpc:vi.fn().mockResolvedValue({data:true,error:null})};const h=createMicrosoftWorkerHandler({db,env:{},fetch:vi.fn()});
  expect(await (await h(request())).json()).toEqual({paused:true});expect(db.rpc).toHaveBeenCalledExactlyOnceWith('microsoft_calendar_authorize_worker',{p_secret:key});
 });
 it.each([false,null,'true'])('rejects an invalid Vault result: %j',async data=>{
  const db={rpc:vi.fn().mockResolvedValue({data,error:null})};const h=createMicrosoftWorkerHandler({db,env:{},fetch:vi.fn()});expect((await h(request())).status).toBe(401);
 });
 it('fails closed on Vault errors without leaking the error',async()=>{
  const db={rpc:vi.fn().mockRejectedValue(new Error('private diagnostic'))};const h=createMicrosoftWorkerHandler({db,env:{},fetch:vi.fn()});const response=await h(request());expect(response.status).toBe(503);expect(await response.text()).not.toContain('private');
 });
 it('does not fall back to Vault when an explicit Edge key is configured',async()=>{
  const db={rpc:vi.fn()};const h=createMicrosoftWorkerHandler({db,env:{MICROSOFT_CALENDAR_WORKER_SECRET:'explicit-key'},fetch:vi.fn()});expect((await h(request())).status).toBe(401);expect(db.rpc).not.toHaveBeenCalled();
 });
});
