import { createClient } from 'npm:@supabase/supabase-js@2.75.0';
import { createMicrosoftCalendarHandler } from '../_shared/calendar/microsoft-handler.js';
const env=Object.fromEntries(['APP_URL','MICROSOFT_CALENDAR_MODE','MICROSOFT_CALENDAR_TEST_USER_IDS','MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET','MICROSOFT_REDIRECT_URI','CALENDAR_ENCRYPTION_KEY'].map(key=>[key,Deno.env.get(key)||'']));
// Keep Google's canonical origin unchanged when Microsoft uses an isolated preview.
env.APP_URL=Deno.env.get('MICROSOFT_APP_URL')||env.APP_URL;
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createMicrosoftCalendarHandler({db,env,fetch,
 authenticate:async(request:Request)=>{
  const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!token)return null;
  const {data,error}=await db.auth.getUser(token);return error?null:data.user;
 }
}));
