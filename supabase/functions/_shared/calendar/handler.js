import {randomToken,sha256,seal,unseal} from './crypto.js';
import {buildAuthorization,validateGrant,validateReturn,publicStatus} from './oauth.js';
import {googleJson} from './google.js';
import {checked,connection,lock,unlock} from './repository.js';
const SAFE_ERRORS=new Set(['SYNC_BUSY','INVALID_OAUTH_STATE','MISSING_CALENDAR_SCOPE','MISSING_REFRESH_TOKEN','WRONG_GOOGLE_ACCOUNT','GOOGLE_ACCOUNT_ALREADY_LINKED','CALENDAR_CREATION_UNCERTAIN','INVALID_SETTINGS']);
export function createCalendarHandler({db,authenticate,env,fetch}) {
 return async request=>{
  const origin=request.headers.get('Origin');const expected=env.APP_URL?new URL(env.APP_URL).origin:'';
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':expected,'Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin!==expected)return reply({error:'FORBIDDEN_ORIGIN'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405);
  let held=null;
  try{
   const user=await authenticate(request);if(!user)return reply({error:'AUTH_REQUIRED'},401);
   const text=await request.text();if(text.length>12000)return reply({error:'REQUEST_TOO_LARGE'},413);
   const body=JSON.parse(text);let row=await connection(db,user.id);
   const configured=env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET&&env.GOOGLE_REDIRECT_URI&&env.CALENDAR_ENCRYPTION_KEY;
   const allowedTest=String(env.GOOGLE_CALENDAR_TEST_USER_IDS||'').split(',').map(x=>x.trim()).includes(user.id);
   const mode=configured&&(env.GOOGLE_CALENDAR_MODE==='public'||(env.GOOGLE_CALENDAR_MODE==='testing'&&allowedTest))?env.GOOGLE_CALENDAR_MODE:'disabled';
   if(body.action==='status')return reply(publicStatus(row,mode));
   // Disconnection remains available during a global feature pause.
   if(mode==='disabled'&&body.action!=='disconnect')return reply({error:'NOT_AVAILABLE'},503);
   const trainer=await checked(db.from('trainers').select('id').eq('user_id',user.id).limit(1));
   if(!trainer?.length)return reply({error:'TRAINER_REQUIRED'},403);
   if(['start','finish','disconnect'].includes(body.action)&&!row){
    await checked(db.from('calendar_connections').upsert({user_id:user.id},{onConflict:'user_id',ignoreDuplicates:true}));
    row=await connection(db,user.id);
   }
   if(body.action==='start'){
    held=await lock(db,user.id);row=held;
    if(row.status==='active')return reply({error:'ALREADY_CONNECTED'},409);
    await checked(db.from('calendar_oauth_states').delete().eq('user_id',user.id));
    const state=randomToken(),verifier=randomToken();
    await checked(db.from('calendar_oauth_states').insert({state_hash:await sha256(state),user_id:user.id,verifier_ciphertext:await seal(verifier,env.CALENDAR_ENCRYPTION_KEY,user.id),expires_at:new Date(Date.now()+600000).toISOString()}));
    return reply({url:await buildAuthorization({clientId:env.GOOGLE_CLIENT_ID,redirectUri:env.GOOGLE_REDIRECT_URI,state,verifier}),state});
   }
   if(body.action==='finish'){
    if(typeof body.state!=='string'||body.state.length>100||typeof body.code!=='string'||body.code.length>8000)throw new Error('INVALID_OAUTH_STATE');
    // Lock BEFORE consuming state: a completed disconnect invalidates every
    // outstanding authorization, including callbacks paused on a database response.
    if(!row){await checked(db.from('calendar_connections').upsert({user_id:user.id},{onConflict:'user_id',ignoreDuplicates:true}));}
    held=await lock(db,user.id);row=held;
    const consumed=await checked(db.from('calendar_oauth_states').delete().eq('state_hash',await sha256(body.state)).eq('user_id',user.id).gt('expires_at',new Date().toISOString()).select('*'));
    const state=consumed?.[0];validateReturn(state,user.id);
    if(row.status==='active')return reply({error:'ALREADY_CONNECTED'},409);
    const verifier=await unseal(state.verifier_ciphertext,env.CALENDAR_ENCRYPTION_KEY,user.id);
    const grant=await googleJson(fetch,'https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,code:body.code,redirect_uri:env.GOOGLE_REDIRECT_URI,grant_type:'authorization_code',code_verifier:verifier})});
    validateGrant(grant);
    const identity=await googleJson(fetch,'https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${grant.access_token}`}});
    if(!identity.sub||!identity.email||identity.email_verified!==true)throw new Error('INVALID_GOOGLE_IDENTITY');
    if(row.google_sub&&row.google_sub!==identity.sub)throw new Error('WRONG_GOOGLE_ACCOUNT');
    const used=await checked(db.from('calendar_connections').select('id').eq('google_sub',identity.sub).neq('id',row.id).limit(1));
    if(used.length)throw new Error('GOOGLE_ACCOUNT_ALREADY_LINKED');
    await checked(db.from('calendar_connections').update({google_sub:identity.sub,account_email:identity.email,token_ciphertext:await seal(JSON.stringify({refresh_token:grant.refresh_token}),env.CALENDAR_ENCRYPTION_KEY,user.id)}).eq('id',row.id).eq('lock_id',row.lock_id));
    if(row.calendar_pending&&!row.calendar_id)throw new Error('CALENDAR_CREATION_UNCERTAIN');
    let calendarId=row.calendar_id;
    if(!calendarId){
     await checked(db.from('calendar_connections').update({calendar_pending:true}).eq('id',row.id).eq('lock_id',row.lock_id));
     const calendar=await googleJson(fetch,'https://www.googleapis.com/calendar/v3/calendars',{method:'POST',headers:{Authorization:`Bearer ${grant.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({summary:'Clementplane',description:`Missions synchronisées depuis Clementplane. Identifiant de récupération : ${row.id}`,timeZone:'Europe/Paris'})});
     if(!calendar.id)throw new Error('CALENDAR_CREATION_UNCERTAIN');
     calendarId=calendar.id;
     await checked(db.from('calendar_connections').update({calendar_id:calendarId,calendar_pending:false}).eq('id',row.id).eq('lock_id',row.lock_id));
    }
    await unlock(db,row,{status:'active',error_code:null,attempts:0,dirty_version:Number(row.dirty_version)+1,cycle_id:null,due_at:new Date().toISOString()});held=null;
    return reply(publicStatus(await connection(db,user.id),mode));
   }
   if(!row)return reply(publicStatus(null,mode));
   held=await lock(db,user.id);row=held;
   if(body.action==='disconnect'){
    let revoked=true;
    if(row.token_ciphertext){
     try{const tokens=JSON.parse(await unseal(row.token_ciphertext,env.CALENDAR_ENCRYPTION_KEY,user.id));await googleJson(fetch,'https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:tokens.refresh_token})});}catch{revoked=false;}
    }
    await checked(db.from('calendar_oauth_states').delete().eq('user_id',user.id));
    await unlock(db,row,{status:'disconnected',token_ciphertext:null,error_code:revoked?null:'revocation_unconfirmed',cycle_id:null});held=null;
   }else if(body.action==='settings'||body.action==='sync'){
    if(body.action==='settings'&&(typeof body.include_fee!=='boolean'||typeof body.include_notes!=='boolean'))throw new Error('INVALID_SETTINGS');
    await unlock(db,row,{...(body.action==='settings'?{include_fee:body.include_fee,include_notes:body.include_notes}:{}),dirty_version:Number(row.dirty_version)+1,cycle_id:null,due_at:new Date().toISOString(),...(row.status==='error'?{status:'active',error_code:null}: {})});held=null;
   }else return reply({error:'UNKNOWN_ACTION'},400);
   return reply(publicStatus(await connection(db,user.id),mode));
  }catch(error){
   const code=SAFE_ERRORS.has(error.message)?error.message:'CALENDAR_REQUEST_FAILED';
   return reply({error:code},code==='SYNC_BUSY'?409:400);
  }finally{
   if(held){try{await unlock(db,held);}catch{/* Lease already gone; do not log secrets/provider bodies. */}}
  }
 };
}
