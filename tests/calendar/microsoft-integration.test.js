import {it,expect,vi} from 'vitest';
import {calendarDatabase} from './support/database.js';
import {createMicrosoftCalendarHandler} from '../../supabase/functions/_shared/calendar/microsoft-handler.js';
import {runMicrosoftCalendarJob} from '../../supabase/functions/_shared/calendar/microsoft-worker.js';
import {randomToken,unseal} from '../../supabase/functions/_shared/calendar/crypto.js';
import {OWNER_PROPERTY} from '../../supabase/functions/_shared/calendar/microsoft.js';
const uid='20000000-0000-0000-0000-000000000001';
it('executes OAuth, worker rotation, disconnect and same-calendar reconnect against the real migrated schema',async()=>{
 const db=await calendarDatabase();
 try{
  const env={APP_URL:'https://example.test',MICROSOFT_CALENDAR_MODE:'testing',MICROSOFT_CALENDAR_TEST_USER_IDS:uid,MICROSOFT_CLIENT_ID:'client',MICROSOFT_CLIENT_SECRET:'secret',MICROSOFT_REDIRECT_URI:'https://example.test/microsoft-calendar-callback.html',CALENDAR_ENCRYPTION_KEY:randomToken()};
  let calendar=null,tokenNo=0;
  const fetch=vi.fn(async(url,options={})=>{
   if(url.endsWith('/token'))return Response.json({access_token:'access',refresh_token:`refresh-${++tokenNo}`,scope:'openid Calendars.ReadWrite'});
   if(url.endsWith('/userinfo'))return Response.json({sub:'microsoft-test-sub'}); // Professional email claim may be absent.
   if(url.includes('/me/calendars?'))return Response.json({value:calendar?[calendar]:[]});
   if(url.endsWith('/me/calendars')&&options.method==='POST'){calendar={id:'graph-calendar',...JSON.parse(options.body)};return Response.json(calendar,{status:201});}
   if(url.includes('/me/calendars/graph-calendar'))return Response.json(calendar);
   throw new Error('Unexpected URL '+url);
  });
  const handler=createMicrosoftCalendarHandler({db,env,fetch,authenticate:async()=>({id:uid})});
  const action=async body=>{const response=await handler(new Request('https://edge.test',{method:'POST',headers:{Origin:env.APP_URL},body:JSON.stringify(body)}));return {status:response.status,data:await response.json()};};
  const start=await action({action:'start'});expect(start.status).toBe(200);expect(start.data.url).toContain('/common/oauth2/v2.0/authorize');
  const finish=await action({action:'finish',state:start.data.state,code:'fictional-code'});expect(finish).toMatchObject({status:200,data:{status:'active',account_email:null}});
  const connection=(await db.sql.query('select * from microsoft_calendar_connections')).rows[0];
  expect(calendar.name).toBe('Clementplane');expect(calendar.singleValueExtendedProperties).toContainEqual({id:OWNER_PROPERTY,value:connection.id});
  expect(connection.token_ciphertext).not.toContain('refresh-');expect(JSON.parse(await unseal(connection.token_ciphertext,env.CALENDAR_ENCRYPTION_KEY,uid)).refresh_token).toBe('refresh-1');
  expect(JSON.stringify(finish.data)).not.toMatch(/ciphertext|refresh_token|lock_id|state_hash/);
  const claim=(await db.rpc('microsoft_calendar_claim',{p_user_ids:[uid]})).data[0];
  expect(await runMicrosoftCalendarJob({db,env,fetch,row:claim})).toMatchObject({finished:true,status:'active',error:null});
  const rotated=(await db.sql.query('select token_ciphertext from microsoft_calendar_connections')).rows[0].token_ciphertext;
  expect(JSON.parse(await unseal(rotated,env.CALENDAR_ENCRYPTION_KEY,uid)).refresh_token).toBe('refresh-2');
  expect((await action({action:'disconnect'})).data.status).toBe('disconnected');
  expect((await db.sql.query('select token_ciphertext from microsoft_calendar_connections')).rows[0].token_ciphertext).toBeNull();
  expect((await action({action:'finish',state:start.data.state,code:'replay'})).status).toBe(400);
  const restart=await action({action:'start'});expect((await action({action:'finish',state:restart.data.state,code:'new-code'})).data.status).toBe('active');
  expect(fetch.mock.calls.filter(([url,options])=>url.endsWith('/me/calendars')&&options.method==='POST')).toHaveLength(1);
  expect((await db.sql.query('select count(*)::int n from calendar_connections')).rows[0].n).toBe(0);
 }finally{await db.sql.close();}
},15000);
