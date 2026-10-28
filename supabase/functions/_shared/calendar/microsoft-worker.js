import {seal,unseal} from './crypto.js';
import {retryDelay} from './google.js';
import {MicrosoftCalendar,graphJson,expandOwnership} from './microsoft.js';
import {microsoftTokenRequest} from './microsoft-oauth.js';
import {projectEvents} from './projection.js';
import {reconcileMicrosoft as reconcile,assertMicrosoftOwned} from './microsoft-sync.js';
import {userCalendarName} from './naming.js';
import {checked,allMappings,eventStore,guard} from './microsoft-repository.js';
export async function runMicrosoftCalendarJob({db,env,fetch,row,deadline=Date.now()+45000}) {
 let status='active',error=null,delay=300+Math.floor(Math.random()*120);
 try{
  await guard(db,row,deadline);
  if(!row.calendar_id||row.calendar_pending)throw new Error('CALENDAR_CREATION_UNCERTAIN');
  const tokens=JSON.parse(await unseal(row.token_ciphertext,env.CALENDAR_ENCRYPTION_KEY,row.user_id));
  const grant=await microsoftTokenRequest(fetch,{clientId:env.MICROSOFT_CLIENT_ID,clientSecret:env.MICROSOFT_CLIENT_SECRET,refreshToken:tokens.refresh_token});
  // Persist rotated refresh tokens before any calendar work, under the lease.
  if(grant.refresh_token) {
   await guard(db,row,deadline);
   const updated=await checked(db.from('microsoft_calendar_connections').update({token_ciphertext:await seal(JSON.stringify({refresh_token:grant.refresh_token}),env.CALENDAR_ENCRYPTION_KEY,row.user_id)}).eq('id',row.id).eq('lock_id',row.lock_id).select('id'));
   if(!updated?.length)throw new Error('LEASE_LOST');
  }
  await guard(db,row,deadline);
  const calendarPath=`/me/calendars/${encodeURIComponent(row.calendar_id)}`;
  const calendar=await graphJson(fetch,grant.access_token,`${calendarPath}?${new URLSearchParams({$expand:expandOwnership})}`);
  assertMicrosoftOwned(calendar,row.id);

  const rows=await checked(db.rpc('calendar_source_snapshot',{p_user_id:row.user_id}));
  if(!Array.isArray(rows))throw new Error('INVALID_SOURCE_SNAPSHOT');
  const mappings=await allMappings(db,row.id);
  const desired=projectEvents(rows,{firstDay:row.first_day,trackedKeys:new Set(mappings.map(x=>x.key)),appUrl:env.APP_URL,owner:row.id,includeFee:row.include_fee,includeNotes:row.include_notes});
  const provider=new MicrosoftCalendar({fetch,token:grant.access_token,calendarId:row.calendar_id});
  await reconcile(provider,eventStore(db,row,deadline),desired);
  await guard(db,row,deadline);
  const name=await userCalendarName(db,row.user_id);
  if(calendar.name!==name){await guard(db,row,deadline);await graphJson(fetch,grant.access_token,calendarPath,{method:'PATCH',body:{name},etag:calendar['@odata.etag']});}
 }catch(e){
  if(['BUDGET_REACHED','LEASE_LOST','RETRY_TOMBSTONE','INCOMPLETE_MISSION_DATES','CALENDAR_DATABASE_ERROR'].includes(e.message)){error='continuing';delay=15;}
  else if(['invalid_grant','interaction_required','consent_required'].includes(e.reason)||e.status===401){status='reconnect';error='authorization_revoked';delay=3600;}
  else if(e.retryable){error='microsoft_temporarily_unavailable';delay=Math.max(retryDelay(row.attempts),e.retryAfter||0);}
  else {status='error';error=({EVENT_CREATION_UNCERTAIN:'event_creation_uncertain',DUPLICATE_MANAGED_EVENT:'duplicate_managed_event',FOREIGN_EVENT:'foreign_event',MANAGED_EVENT_HAS_GUESTS:'managed_event_has_guests',CALENDAR_CREATION_UNCERTAIN:'calendar_creation_uncertain',INVALID_MISSION_DATE:'invalid_mission_date',INVALID_MISSION_TIME:'invalid_mission_time'})[e.message]||'synchronization_failed';delay=3600;}
 }
 const finished=await checked(db.rpc('microsoft_calendar_finish',{p_id:row.id,p_lock:row.lock_id,p_version:row.dirty_version,p_status:status,p_error:error,p_delay:delay}));
 return {finished,status,error};
}
export function secureEqual(a,b){
 if(typeof a!=='string'||typeof b!=='string'||!a||a.length!==b.length)return false;
 let result=0;for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);return result===0;
}
export function createMicrosoftWorkerHandler({db,env,fetch}){
 return async request=>{
  if(request.method!=='POST')return new Response(null,{status:405});
  if(!secureEqual(request.headers.get('X-Calendar-Worker-Secret'),env.MICROSOFT_CALENDAR_WORKER_SECRET))return new Response(null,{status:401});
  if(!env.MICROSOFT_CLIENT_ID||!env.MICROSOFT_CLIENT_SECRET||!env.CALENDAR_ENCRYPTION_KEY||!['testing','public'].includes(env.MICROSOFT_CALENDAR_MODE))return Response.json({paused:true});
  const deadline=Date.now()+45000;let count=0;
  try{
   await checked(db.from('microsoft_calendar_oauth_states').delete().lt('expires_at',new Date().toISOString()));
   while(Date.now()<deadline-12000&&count<5){
    const jobs=await checked(db.rpc('microsoft_calendar_claim',{p_user_ids:env.MICROSOFT_CALENDAR_MODE==='testing'?String(env.MICROSOFT_CALENDAR_TEST_USER_IDS||'').split(',').map(x=>x.trim()).filter(x=>/^[0-9a-f-]{36}$/i.test(x)):null}));if(!jobs?.length)break;
    await runMicrosoftCalendarJob({db,env,fetch,row:jobs[0],deadline});count++;
   }
   return Response.json({processed:count});
  }catch{return Response.json({error:'WORKER_FAILED'},{status:500});}
 };
}

