import {it,expect} from 'vitest';
import {createCalendarHandler} from '../../supabase/functions/_shared/calendar/handler.js';
import {randomToken,sha256,seal} from '../../supabase/functions/_shared/calendar/crypto.js';
it('serializes OAuth completion with disconnection and cannot reactivate a completed disconnect',async()=>{
 const user='user-a',secret=randomToken(),stateValue='state-a';
 const row={id:'connection-a',user_id:user,status:'reconnect',google_sub:'google-a',account_email:'demo@example.test',calendar_id:'calendar-a',dirty_version:1,synced_version:1,token_ciphertext:await seal(JSON.stringify({refresh_token:'old'}),secret,user)};
 let states=[{state_hash:await sha256(stateValue),user_id:user,verifier_ciphertext:await seal('verifier',secret,user),expires_at:new Date(Date.now()+600000).toISOString()}];
 let notifyConsumed,releaseFinish;const consumed=new Promise(r=>{notifyConsumed=r;}),resume=new Promise(r=>{releaseFinish=r;});let lockNo=0;
 class Q {
  constructor(table){this.table=table;this.op='select';this.filters=[];}
  select(){this.returning=true;return this;}delete(){this.op='delete';return this;}update(values){this.op='update';this.values=values;return this;}
  eq(k,v){this.filters.push(x=>x[k]===v);return this;}neq(k,v){this.filters.push(x=>x[k]!==v);return this;}gt(k,v){this.filters.push(x=>x[k]>v);return this;}limit(){return this;}maybeSingle(){this.single=true;return this;}
  then(ok,fail){return this.exec().then(ok,fail);}
  async exec(){const matches=x=>this.filters.every(f=>f(x));
   if(this.table==='trainers')return {data:[{id:'trainer-a'}]};
   if(this.table==='calendar_oauth_states'){const data=states.filter(matches);states=states.filter(x=>!matches(x));if(this.returning){notifyConsumed();await resume;}return {data};}
   if(this.table==='calendar_connections'){const data=matches(row)?[structuredClone(row)]:[];if(this.op==='update'&&data.length)Object.assign(row,this.values);return {data:this.single?(data[0]||null):data};}throw new Error(this.table);
  }
 }
 const db={from:t=>new Q(t),rpc:async name=>{if(name!=='calendar_lock')throw new Error(name);if(row.lock_id)return {data:[]};row.lock_id=`lock-${++lockNo}`;row.lock_until=new Date(Date.now()+300000).toISOString();return {data:[structuredClone(row)]};}};
 const env={APP_URL:'https://example.test',GOOGLE_CALENDAR_MODE:'public',GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'secret',GOOGLE_REDIRECT_URI:'https://example.test/google-calendar-callback.html',CALENDAR_ENCRYPTION_KEY:secret};
 const fetch=async url=>Response.json(url.includes('/token')?{access_token:'access',refresh_token:'new',scope:'openid email https://www.googleapis.com/auth/calendar.app.created'}:url.includes('/userinfo')?{sub:'google-a',email:'demo@example.test',email_verified:true}:{});
 const handler=createCalendarHandler({db,authenticate:async()=>({id:user}),env,fetch});const request=body=>new Request('https://edge.test',{method:'POST',headers:{Origin:env.APP_URL},body:JSON.stringify(body)});
 const finishing=handler(request({action:'finish',code:'code',state:stateValue}));await consumed;
 const during=await handler(request({action:'disconnect'}));releaseFinish();await finishing;
 expect(during.status).toBe(409);
 const after=await handler(request({action:'disconnect'}));expect(after.status).toBe(200);expect(row.status).toBe('disconnected');expect(row.token_ciphertext).toBeNull();
 const replay=await handler(request({action:'finish',code:'code',state:stateValue}));expect(replay.status).toBe(400);expect(row.status).toBe('disconnected');
});
