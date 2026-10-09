import {eventId} from './projection.js';
function assertOwned(event,owner,key){
 const p=event?.extendedProperties?.private;
 if(p?.clementplaneOwner!==owner||p?.clementplaneKey!==key)throw new Error('FOREIGN_EVENT');
 if(event.attendees?.length)throw new Error('MANAGED_EVENT_HAS_GUESTS');
}
/** Store must persist intent BEFORE network mutation and guard the exclusive lease. */
export async function reconcile(provider,store,desired) {
 const known=new Map((await store.list()).map(m=>[m.key,m]));
 for(const [key,event] of desired) {
  await store.guard();
  let mapping=known.get(key)||{key,generation:0,event_id:await eventId(store.owner,key,0)};
  if(mapping.deleted)mapping={...mapping,deleted:false,checked_cycle:null,generation:mapping.generation+1,event_id:await eventId(store.owner,key,mapping.generation+1)};
  if(store.cycle && mapping.checked_cycle===store.cycle)continue;
  await store.save(mapping);
  await store.guard();
  let remote=await provider.get(mapping.event_id);
  if(remote?.status==='cancelled') {
   // Google tombstones need not retain extended properties. Only a persisted id is trusted.
   mapping={...mapping,generation:mapping.generation+1,event_id:await eventId(store.owner,key,mapping.generation+1)};
   await store.save(mapping);remote=await provider.get(mapping.event_id);
   if(remote?.status==='cancelled')throw new Error('RETRY_TOMBSTONE');
  }
  if(remote) {
   assertOwned(remote,store.owner,key);await store.guard();
   await provider.update(mapping.event_id,event,remote.etag);
  }else{
   await store.guard();
   try{await provider.insert(mapping.event_id,event);}catch(error){
    if(error.status!==409)throw error;
    await store.guard();const found=await provider.get(mapping.event_id);
    if(found?.status==='cancelled') {
     mapping={...mapping,generation:mapping.generation+1,event_id:await eventId(store.owner,key,mapping.generation+1)};
     await store.save(mapping);throw new Error('RETRY_TOMBSTONE');
    }
    assertOwned(found,store.owner,key);await store.guard();await provider.update(mapping.event_id,event,found.etag);
   }
  }
  if(store.cycle)await store.save({...mapping,checked_cycle:store.cycle});
 }
 for(const [key,mapping] of known) {
  if(desired.has(key)||mapping.deleted)continue;
  await store.guard();const remote=await provider.get(mapping.event_id);
  if(remote&&remote.status!=='cancelled'){
   assertOwned(remote,store.owner,key);await store.guard();await provider.remove(mapping.event_id,remote.etag);
  }
  await store.guard();await store.save({...mapping,deleted:true,checked_cycle:null});
 }
}
