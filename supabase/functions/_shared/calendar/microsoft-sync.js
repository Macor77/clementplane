import {eventId} from './projection.js';
import {OWNER_PROPERTY, KEY_PROPERTY, toMicrosoftEvent} from './microsoft.js';
export function assertMicrosoftOwned(event, owner, key) {
 const props = new Map((event?.singleValueExtendedProperties || []).map(p => [p.id,p.value]));
 if (props.get(OWNER_PROPERTY)!==owner || (key!==undefined && props.get(KEY_PROPERTY)!==key)) throw new Error('FOREIGN_EVENT');
 if (event.attendees?.length) throw new Error('MANAGED_EVENT_HAS_GUESTS');
}
/** Persist create intent before Graph, recover by scoped property after a lost response. */
export async function reconcileMicrosoft(provider,store,desired) {
 const known=new Map((await store.list()).map(m=>[m.key,m]));
 for (const [key,event] of desired) {
  await store.guard();
  let mapping=known.get(key)||{key,generation:0,event_id:null};
  if(mapping.deleted) mapping={...mapping,generation:mapping.generation+1,event_id:null,creation_pending:false,deleted:false,checked_cycle:null};
  if(store.cycle && mapping.checked_cycle===store.cycle) continue;
  await store.save(mapping);
  let remote=mapping.event_id?await provider.get(mapping.event_id):await provider.find(key);
  if(mapping.event_id && !remote) {
   // A known event was removed in Outlook; a new generation needs a new transactionId.
   mapping={...mapping,generation:mapping.generation+1,event_id:null,creation_pending:false};await store.save(mapping);
   remote=await provider.find(key);
  }
  const projected=toMicrosoftEvent(event,store.owner,key);
  if(remote) {
   assertMicrosoftOwned(remote,store.owner,key);await store.guard();
   await provider.update(remote.id,projected,remote['@odata.etag']);
  } else {
   if(mapping.creation_pending)throw new Error('EVENT_CREATION_UNCERTAIN');
   mapping={...mapping,creation_pending:true};await store.save(mapping);
   await store.guard();
   try{remote=await provider.insert(projected,await eventId(store.owner,key,mapping.generation));}
   catch(error){
    // Explicit throttling/validation failures did not create an event. Network/5xx
    // failures remain ambiguous; recovery must find the marker before retrying.
    if(error.status>=400&&error.status<500&&error.status!==408)await store.save({...mapping,creation_pending:false});
    throw error;
   }
   if(!remote?.id) throw new Error('INVALID_GRAPH_EVENT');
  }
  await store.save({...mapping,event_id:remote.id,creation_pending:false,checked_cycle:store.cycle||null});
 }
 for(const [key,mapping] of known) {
  if(desired.has(key)||mapping.deleted)continue;
  await store.guard();
  const remote=mapping.event_id?await provider.get(mapping.event_id):await provider.find(key);
  if(!remote&&mapping.creation_pending)throw new Error('EVENT_CREATION_UNCERTAIN');
  if(remote){assertMicrosoftOwned(remote,store.owner,key);await store.guard();await provider.remove(remote.id,remote['@odata.etag']);}
  await store.save({...mapping,deleted:true,checked_cycle:null});
 }
}
