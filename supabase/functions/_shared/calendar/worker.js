import {unseal} from './crypto.js';
import {GoogleCalendar,googleJson,retryDelay} from './google.js';
import {projectEvents} from './projection.js';
import {reconcile} from './sync.js';
import {checked,allMappings,eventStore,guard} from './repository.js';
export async function runCalendarJob({db,env,fetch,row,deadline=Date.now()+45000}) {
 let status='active',error=null,delay=300+Math.floor(Math.random()*120);
 try{
  await guard(db,row,deadline);
  if(!row.calendar_id||row.calendar_pending)throw new Error('CALENDAR_CREATION_UNCERTAIN');
  const tokens=JSON.parse(await unseal(row.token_ciphertext,env.CALENDAR_ENCRYPTION_KEY,row.user_id));
  const grant=await googleJson(fetch,'https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:tokens.refresh_token,grant_type:'refresh_token'})});
  if(!grant.access_token)throw new Error('MISSING_ACCESS_TOKEN');
  await guard(db,row,deadline);
  const rows=await checked(db.rpc('calendar_source_snapshot',{p_user_id:row.user_id}));
  if(!Array.isArray(rows))throw new Error('INVALID_SOURCE_SNAPSHOT');
  const mappings=await allMappings(db,row.id);
  const desired=projectEvents(rows,{firstDay:row.first_day,trackedKeys:new Set(mappings.map(x=>x.key)),appUrl:env.APP_URL,owner:row.id,includeFee:row.include_fee,includeNotes:row.include_notes});
  const provider=new GoogleCalendar({fetch,token:grant.access_token,calendarId:row.calendar_id});
  await reconcile(provider,eventStore(db,row,deadline),desired);
  await guard(db,row,deadline);
 }catch(e){
  if(['BUDGET_REACHED','LEASE_LOST','RETRY_TOMBSTONE','INCOMPLETE_MISSION_DATES','CALENDAR_DATABASE_ERROR'].includes(e.message)){error='continuing';delay=15;}
  else if(e.reason==='invalid_grant'||e.status===401){status='reconnect';error='authorization_revoked';delay=3600;}
  else if(e.retryable){error='google_temporarily_unavailable';delay=Math.max(retryDelay(row.attempts),e.retryAfter||0);}
  else {status='error';error=({FOREIGN_EVENT:'foreign_event',MANAGED_EVENT_HAS_GUESTS:'managed_event_has_guests',CALENDAR_CREATION_UNCERTAIN:'calendar_creation_uncertain',INVALID_MISSION_DATE:'invalid_mission_date',INVALID_MISSION_TIME:'invalid_mission_time'})[e.message]||'synchronization_failed';delay=3600;}
 }
 const finished=await checked(db.rpc('calendar_finish',{p_id:row.id,p_lock:row.lock_id,p_version:row.dirty_version,p_status:status,p_error:error,p_delay:delay}));
 return {finished,status,error};
}
export function secureEqual(a,b){
 if(typeof a!=='string'||typeof b!=='string'||!a||a.length!==b.length)return false;
 let result=0;for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);return result===0;
}
export function createWorkerHandler({db,env,fetch}){
 return async request=>{
  if(request.method!=='POST')return new Response(null,{status:405});
  if(!secureEqual(request.headers.get('X-Calendar-Worker-Secret'),env.CALENDAR_WORKER_SECRET))return new Response(null,{status:401});
  if(!['testing','public'].includes(env.GOOGLE_CALENDAR_MODE))return Response.json({paused:true});
  const deadline=Date.now()+45000;let count=0;
  try{
   await checked(db.from('calendar_oauth_states').delete().lt('expires_at',new Date().toISOString()));
   while(Date.now()<deadline-12000&&count<5){
    const jobs=await checked(db.rpc('calendar_claim'));if(!jobs?.length)break;
    await runCalendarJob({db,env,fetch,row:jobs[0],deadline});count++;
   }
   return Response.json({processed:count});
  }catch{return Response.json({error:'WORKER_FAILED'},{status:500});}
 };
}
