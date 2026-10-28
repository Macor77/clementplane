import { createClient } from 'npm:@supabase/supabase-js@2.75.0';
import { createMicrosoftWorkerHandler } from '../_shared/calendar/microsoft-worker.js';
const env=Object.fromEntries(['APP_URL','MICROSOFT_CALENDAR_MODE','MICROSOFT_CALENDAR_TEST_USER_IDS','MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET','CALENDAR_ENCRYPTION_KEY','MICROSOFT_CALENDAR_WORKER_SECRET'].map(key=>[key,Deno.env.get(key)||'']));
// Mission links must use the same canonical origin as Microsoft's OAuth handler.
env.APP_URL=Deno.env.get('MICROSOFT_APP_URL')||env.APP_URL;
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createMicrosoftWorkerHandler({db,env,fetch}));
