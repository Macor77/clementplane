// The durable 'sending' fence prevents overlapping calls and blind retries.
// An uncertain provider result requires reconciliation, never automatic replay.
export async function processResponseJob(job, deps) {
 const delay = [60,300,900,3600,14400,86400][Math.min(job.attempts-1,5)];
 let fenced=false;
 try {
  const prepared=await deps.prepare(job);
  if(prepared.alreadyNotified){await deps.finish(prepared.alreadyNotified,'Legacy notification already recorded',60);return;}
  const {emailPayload,logPayload}=prepared;
  await deps.saveLog({...logPayload,id:job.id});
  if(!await deps.start()) return;
  fenced=true;
  const response=await deps.send({...emailPayload,headers:{...emailPayload.headers,'X-Mailin-custom':`formaplane_log_id:${job.id}`}});
  if(response.status===429){
   const retryAfter=Number(response.headers.get('retry-after'));
   const wait=Number.isFinite(retryAfter)?Math.max(delay,retryAfter):delay;
   await deps.finish('pending','Brevo HTTP 429',wait);return;
  }
  if(response.status>=500) {await deps.finish('uncertain',`Brevo HTTP ${response.status}`,60);return;}
  if(!response.ok){
   await deps.updateLog({status:'failed',failed_at:new Date().toISOString(),error_message:`Brevo HTTP ${response.status}`});
   await deps.finish('failed',`Brevo HTTP ${response.status}`,60);return;
  }
  const body=await response.json();
  if(!body.messageId) {await deps.finish('uncertain','Provider response missing messageId',60);return;}
  await deps.updateLog({status:'sent',sent_at:new Date().toISOString(),provider_message_id:body.messageId,error_message:null});
  await deps.finish('sent',null,60);
 }catch{
  await deps.finish(fenced?'uncertain':'pending',fenced?'Provider submission or persistence uncertain':'Preparation failed',fenced?60:delay);
 }
}
