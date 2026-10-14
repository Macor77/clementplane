import { createClient } from 'npm:@supabase/supabase-js@2.75.0';
import { createWorkerHandler } from '../_shared/calendar/worker.js';
const env=Object.fromEntries(['APP_URL','GOOGLE_CALENDAR_MODE','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','CALENDAR_ENCRYPTION_KEY','CALENDAR_WORKER_SECRET'].map(key=>[key,Deno.env.get(key)||'']));
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createWorkerHandler({db,env,fetch}));
