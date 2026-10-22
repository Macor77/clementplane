import { createClient } from 'npm:@supabase/supabase-js@2.75.0';
import { prepareResponseEmail } from '../_shared/mission-response-email.ts';
import { processResponseJob } from '../_shared/mission-response-worker.js';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const checked=async(p:PromiseLike<any>)=>{const r=await p;if(r.error)throw new Error('Database operation failed');return r.data;};
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({success:false},405);
 const secret=Deno.env.get('CALENDAR_WORKER_SECRET');
 const workerHeader=req.headers.get('X-Calendar-Worker-Secret');
 if(!workerHeader){
  // Backward compatibility for old cached clients. Sending is now server-only.
  return json({success:true,queued:true});
 }
 if(!secret||workerHeader!==secret)return json({success:false},401);
 const brevoKey=Deno.env.get('BREVO_API_KEY');
 if(!brevoKey)return json({success:false},503);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const body=await req.json().catch(()=>({}));
  if(body.dryRun===true){
   const relation=await checked(db.from('mission_formateurs').select('id,statut,repondu_le,response_comment').eq('id',body.relationId).single());
   if(!['accepte','refuse'].includes(relation.statut)||!relation.repondu_le)return json({success:false},409);
   const prepared=await prepareResponseEmail(db,{relation_id:relation.id,response:relation.statut,responded_at:relation.repondu_le,response_comment:relation.response_comment});
   return json({success:true,dryRun:true,recipientResolved:!!prepared.emailPayload?.to?.length,contentReady:!!prepared.emailPayload?.htmlContent,alreadyNotified:prepared.alreadyNotified||null});
  }
  let processed=0;
  // Bound work to stay comfortably inside the cron HTTP timeout.
  const started=Date.now();
  while(processed<10 && Date.now()-started<25000){
   const jobs=await checked(db.rpc('claim_mission_response'));
   const job=jobs?.[0];if(!job)break;
   await processResponseJob(job,{
    prepare:()=>prepareResponseEmail(db,job),
    saveLog:async(log:any)=>{await checked(db.from('email_logs').upsert(log,{onConflict:'id',ignoreDuplicates:true}));},
    start:()=>checked(db.rpc('start_mission_response_send',{p_id:job.id,p_lock:job.lock_id})),
    finish:async(status:string,error:string|null,delay:number)=>{
     const ok=await checked(db.rpc('finish_mission_response',{p_id:job.id,p_lock:job.lock_id,p_status:status,p_error:error,p_delay:delay}));
     if(!ok)throw new Error('Worker lease lost');
    },
    // Never overwrite a delivered/bounced/opened state already set by webhook.
    updateLog:async(values:any)=>{await checked(db.from('email_logs').update(values).eq('id',job.id).in('status',['pending']));},
    send:(payload:any)=>fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':brevoKey,'content-type':'application/json',accept:'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)}),
   });
   processed++;
  }
  return json({success:true,processed});
 }catch{console.error('Mission response worker failed; inspect outbox status');return json({success:false},500);}
});
