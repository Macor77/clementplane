import { createClient } from 'npm:@supabase/supabase-js@2.75.0';
import { createCalendarHandler } from '../_shared/calendar/handler.js';
const env=Object.fromEntries(['APP_URL','GOOGLE_CALENDAR_MODE','GOOGLE_CALENDAR_TEST_USER_IDS','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REDIRECT_URI','CALENDAR_ENCRYPTION_KEY'].map(key=>[key,Deno.env.get(key)||'']));
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createCalendarHandler({db,env,fetch,
 authenticate:async(request:Request)=>{
  const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!token)return null;
  const {data,error}=await db.auth.getUser(token);return error?null:data.user;
 }
}));
