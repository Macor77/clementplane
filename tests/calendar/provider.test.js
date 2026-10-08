import {describe,it,expect,vi} from 'vitest';
import {GoogleCalendar,GoogleError,retryDelay} from '../../supabase/functions/_shared/calendar/google.js';
import {reconcile} from '../../supabase/functions/_shared/calendar/sync.js';
import {seal,unseal,randomToken,sha256} from '../../supabase/functions/_shared/calendar/crypto.js';
const owner='owner-a',key='personal:m:2026-10-25';
const event={key,summary:'Formation',visibility:'private',attendees:[],extendedProperties:{private:{clementplaneOwner:owner,clementplaneKey:key}}};
function setup(existing) {
 const remote=new Map(existing?[[existing.id,existing]]:[]), mappings=new Map(existing?[[key,{key,event_id:existing.id,generation:0}]]:[]);
 const provider={get:vi.fn(async id=>remote.get(id)||null),insert:vi.fn(async(id,e)=>{remote.set(id,{...e,id,etag:'new'});}),update:vi.fn(async(id,e)=>{remote.set(id,{...e,id,etag:'new'});}),remove:vi.fn(async id=>{remote.delete(id);})};
 const store={owner,list:async()=>[...mappings.values()],save:async m=>mappings.set(m.key,m),drop:async k=>mappings.delete(k),guard:async()=>{}};
 return {remote,mappings,provider,store};
}
describe('provider safety and retries',()=>{
 it('sends no invitations, uses etags and omits internal key',async()=>{
  const fetch=vi.fn(async()=>new Response('{}',{status:200}));const p=new GoogleCalendar({fetch,token:'test-token',calendarId:'cal-a'});
  await p.update('id-a',event,'etag-a');const [url,opt]=fetch.mock.calls[0];expect(url).toContain('sendUpdates=none');expect(opt.headers['If-Match']).toBe('etag-a');expect(JSON.parse(opt.body).key).toBeUndefined();expect(JSON.parse(opt.body).attendees).toEqual([]);
 });
 it.each([429,500,503])('classifies %s transient without exposing response secrets',async status=>{
  const p=new GoogleCalendar({fetch:async()=>new Response('{"secret":"DO NOT LOG"}',{status}),token:'secret',calendarId:'cal'});
  await expect(p.get('e')).rejects.toMatchObject({retryable:true});await expect(p.get('e')).rejects.not.toThrow('DO NOT LOG');
 });
 it('distinguishes quota 403 and insufficient permissions',async()=>{
  for(const [reason,retryable] of [['rateLimitExceeded',true],['forbidden',false]]){
   const p=new GoogleCalendar({fetch:async()=>new Response(JSON.stringify({error:{errors:[{reason}]}}),{status:403}),token:'x',calendarId:'c'});await expect(p.get('e')).rejects.toMatchObject({retryable});
  }
  expect(retryDelay(20,()=>0.5)).toBeLessThanOrEqual(3600);
 });
 it('keeps an inserted event stable on retry after lost database acknowledgment',async()=>{
  const s=setup();await reconcile(s.provider,s.store,new Map([[key,event]]));await reconcile(s.provider,s.store,new Map([[key,event]]));expect(s.remote.size).toBe(1);expect(s.provider.insert).toHaveBeenCalledTimes(1);
 });
 it('adopts deterministic event on 409 only after checking owner marker',async()=>{
  const s=setup();s.provider.insert=async(id,e)=>{s.remote.set(id,{...e,id});throw new GoogleError(409,'conflict');};await reconcile(s.provider,s.store,new Map([[key,event]]));expect(s.remote.size).toBe(1);
 });
 it('recreates a deleted tombstone with persisted new generation',async()=>{
  const s=setup({id:'old',status:'cancelled'});await reconcile(s.provider,s.store,new Map([[key,event]]));expect(s.mappings.get(key).generation).toBe(1);expect(s.provider.remove).not.toHaveBeenCalled();
 });
 it('never changes or deletes foreign events, even on matching map id',async()=>{
  const s=setup({id:'foreign',summary:'Private Google event'});await expect(reconcile(s.provider,s.store,new Map([[key,event]]))).rejects.toThrow('FOREIGN_EVENT');expect(s.provider.update).not.toHaveBeenCalled();await expect(reconcile(s.provider,s.store,new Map())).rejects.toThrow('FOREIGN_EVENT');expect(s.provider.remove).not.toHaveBeenCalled();
 });
 it('stops before the next Google operation when disconnected/lease lost',async()=>{
  const s=setup();s.store.guard=async()=>{throw new Error('LEASE_LOST');};await expect(reconcile(s.provider,s.store,new Map([[key,event]]))).rejects.toThrow('LEASE_LOST');expect(s.provider.insert).not.toHaveBeenCalled();
 });
 it('deletes obsolete owned dates but preserves unmanaged remote events',async()=>{
  const s=setup({id:'old',...event});s.remote.set('external',{id:'external'});await reconcile(s.provider,s.store,new Map());expect(s.remote.has('old')).toBe(false);expect(s.remote.has('external')).toBe(true);
 });
 it('never persists plaintext, binds ciphertext to owner, detects tampering',async()=>{
  const secret=randomToken();const value=await seal('refresh-secret',secret,'user-a');expect(value).not.toContain('refresh-secret');expect(await unseal(value,secret,'user-a')).toBe('refresh-secret');await expect(unseal(value,secret,'user-b')).rejects.toThrow();await expect(unseal(value.slice(0,-3)+'AAA',secret,'user-a')).rejects.toThrow();expect(await sha256('x')).toHaveLength(64);
 });
});
it('resumes a bounded cycle without rewriting already checked events',async()=>{
 const s=setup();s.store.cycle='cycle-a';await reconcile(s.provider,s.store,new Map([[key,event]]));await reconcile(s.provider,s.store,new Map([[key,event]]));expect(s.provider.update).not.toHaveBeenCalled();expect(s.mappings.get(key).checked_cycle).toBe('cycle-a');
 s.store.cycle='cycle-b';await reconcile(s.provider,s.store,new Map([[key,event]]));expect(s.provider.update).toHaveBeenCalledTimes(1);
});
it('treats an ETag race as retriable instead of disabling synchronization',async()=>{
 const p=new GoogleCalendar({fetch:async()=>new Response('{}',{status:412}),token:'x',calendarId:'c'});await expect(p.update('e',event,'old')).rejects.toMatchObject({retryable:true});
});
it('repeated cancellation and recreation retains generation beyond tombstones',async()=>{
 const s=setup();s.provider.remove=async id=>{s.remote.set(id,{id,status:'cancelled'});};
 for(let generation=0;generation<4;generation++){
  await reconcile(s.provider,s.store,new Map([[key,event]]));expect(s.mappings.get(key).generation).toBe(generation);
  await reconcile(s.provider,s.store,new Map());
 }
});
