import {describe,it,expect,vi} from 'vitest';
import * as sync from '../../supabase/functions/_shared/calendar/microsoft-sync.js';
import {OWNER_PROPERTY,KEY_PROPERTY} from '../../supabase/functions/_shared/calendar/microsoft.js';
const owner='connection',key='personal:m:2026-11-02';
const event={summary:'SST',description:'Mission',start:{date:'2026-11-02'},end:{date:'2026-11-03'},extendedProperties:{private:{clementplaneOwner:owner,clementplaneKey:key}}};
function setup(){
 const saved=new Map(), remote=new Map();let next=0;
 const store={owner,cycle:'cycle1',list:async()=>[...saved.values()],guard:vi.fn(),save:async m=>saved.set(m.key,{...m})};
 const provider={get:async id=>remote.get(id)||null,find:async()=>[...remote.values()][0]||null,
 insert:vi.fn(async (e)=>{const r={...e,id:`graph-${++next}`};remote.set(r.id,r);return r;}),
 update:vi.fn(async(id,e)=>remote.set(id,{...e,id})),remove:vi.fn(async id=>remote.delete(id))};
 return {saved,remote,store,provider};
}
describe('Microsoft reconciliation',()=>{
 it('persists Graph identifiers and updates then deletes the same event',async()=>{
  expect(sync.reconcileMicrosoft).toBeTypeOf('function');
  const s=setup();await sync.reconcileMicrosoft(s.provider,s.store,new Map([[key,event]]));
  expect(s.saved.get(key).event_id).toBe('graph-1');expect(s.remote.size).toBe(1);
  s.store.cycle='cycle2';await sync.reconcileMicrosoft(s.provider,s.store,new Map([[key,{...event,summary:'Changed'}]]));
  expect(s.remote.get('graph-1').subject).toBe('Changed');expect(s.provider.insert).toHaveBeenCalledTimes(1);
  await sync.reconcileMicrosoft(s.provider,s.store,new Map());expect(s.remote.size).toBe(0);expect(s.saved.get(key).deleted).toBe(true);
 });
 it('recovers a lost create response without creating twice',async()=>{
  const s=setup();const create=s.provider.insert;
  s.provider.insert=vi.fn(async(...args)=>{await create(...args);throw new Error('lost response');});
  await expect(sync.reconcileMicrosoft(s.provider,s.store,new Map([[key,event]]))).rejects.toThrow('lost response');
  s.provider.insert=create;
  await sync.reconcileMicrosoft(s.provider,s.store,new Map([[key,event]]));expect(s.remote.size).toBe(1);expect(create).toHaveBeenCalledTimes(1);
 });
 it.each(['foreign','guests'])('refuses mutation of %s events',async kind=>{
  const s=setup();s.saved.set(key,{key,event_id:'e',generation:0});
  s.remote.set('e',{id:'e',attendees:kind==='guests'?[{emailAddress:{address:'guest@example.test'}}]:[],singleValueExtendedProperties:[{id:OWNER_PROPERTY,value:kind==='foreign'?'other':owner},{id:KEY_PROPERTY,value:key}]});
  await expect(sync.reconcileMicrosoft(s.provider,s.store,new Map([[key,event]]))).rejects.toThrow(kind==='foreign'?'FOREIGN_EVENT':'MANAGED_EVENT_HAS_GUESTS');
  expect(s.provider.update).not.toHaveBeenCalled();expect(s.provider.remove).not.toHaveBeenCalled();
 });
 it('recovers and removes an uncertain create even if the mission was cancelled meanwhile',async()=>{
  const s=setup();s.saved.set(key,{key,event_id:null,generation:0});
  s.remote.set('e',{id:'e',singleValueExtendedProperties:[{id:OWNER_PROPERTY,value:owner},{id:KEY_PROPERTY,value:key}]});
  await sync.reconcileMicrosoft(s.provider,s.store,new Map());expect(s.remote.size).toBe(0);
 });
});
it('does not repeat an ambiguous POST or forget a cancelled ambiguous create',async()=>{
 const s=setup();s.saved.set(key,{key,event_id:null,generation:0,creation_pending:true});
 await expect(sync.reconcileMicrosoft(s.provider,s.store,new Map([[key,event]]))).rejects.toThrow('EVENT_CREATION_UNCERTAIN');
 expect(s.provider.insert).not.toHaveBeenCalled();
 await expect(sync.reconcileMicrosoft(s.provider,s.store,new Map())).rejects.toThrow('EVENT_CREATION_UNCERTAIN');
 expect(s.saved.get(key).deleted).not.toBe(true);
});
