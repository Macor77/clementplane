import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=process.env.E2E_PERSONAL_DATA_DIR;
if(!root?.endsWith('/')) throw new Error('E2E_PERSONAL_DATA_DIR must name an isolated fixture directory ending with /');
const c=JSON.parse(fs.readFileSync(root+'credentials.json'));const k=JSON.parse(fs.readFileSync(root+'public-key.json'));const sessions=JSON.parse(fs.readFileSync(root+'sessions.json'));
if(c.project==='hctvkynrgmnxjynbncdi'||c.project!==process.env.E2E_PROJECT_REF||k.url!==`https://${c.project}.supabase.co`) throw new Error('Refuse production or mismatched test project');
async function api(actor,path,method='GET',body){
 const r=await fetch(k.url+'/rest/v1/'+path,{method,headers:{apikey:k.key,Authorization:'Bearer '+(actor===null?k.key:sessions[actor].access_token),'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}
 return {status:r.status,data};
}
const id=crypto.randomUUID();c.personal=id;fs.writeFileSync(root+'credentials.json',JSON.stringify(c));
const base={id,title:'Intervention privée fictive v0211',dates:[{date:'2026-10-20',heure_debut:'09:00',heure_fin:'12:00'},{date:'2026-10-21'}],client_name:'Client fictif v0211',private_notes:'Note fictive strictement privée',fee:250,fee_unit:'day'};
let r=await api(0,'trainer_personal_missions','POST',base);assert.equal(r.status,201,JSON.stringify(r));assert.equal(r.data[0].revision,1);
assert.equal((await api(0,'trainer_personal_missions','POST',base)).status,409);
for(const actor of [1,2,3]){
 r=await api(actor,'trainer_personal_missions?id=eq.'+id);assert.deepEqual(r.data,[]);
 r=await api(actor,'trainer_personal_missions?id=eq.'+id,'PATCH',{title:'FORGED'});assert.deepEqual(r.data,[]);
}
assert((await api(null,'trainer_personal_missions?id=eq.'+id)).status>=400);
assert((await api(1,'trainer_personal_missions','POST',{...base,id:crypto.randomUUID(),owner_user_id:c.users[0],trainer_id:c.trainers[0]})).status>=400);
assert((await api(0,'trainer_personal_missions?id=eq.'+id,'PATCH',{dates:[{date:'2026-02-30'}]})).status>=400);
r=await api(0,'trainer_personal_missions?id=eq.'+id+'&revision=eq.1','PATCH',{title:'Intervention modifiée fictive v0211'});assert.equal(r.data[0].revision,2);
r=await api(0,'trainer_personal_missions?id=eq.'+id+'&revision=eq.1','PATCH',{title:'Stale'});assert.deepEqual(r.data,[]);
const args={p_start_day:'2026-10-01',p_end_day:'2026-10-31'};
r=await api(0,'rpc/get_my_trainer_commitments_with_mission','POST',args);assert.equal(r.data.filter(row=>row.mission_id===id).length,2);
r=await api(1,'rpc/get_my_trainer_commitments_with_mission','POST',args);assert(!r.data.some(row=>row.mission_id===id));
r=await api(0,'rpc/set_my_trainer_availability','POST',{p_day:'2026-10-20',p_status:'indispo',p_note:''});assert.equal(r.status,200,JSON.stringify(r));
const second=crypto.randomUUID();c.secondPersonal=second;fs.writeFileSync(root+'credentials.json',JSON.stringify(c));
assert.equal((await api(0,'trainer_personal_missions','POST',{id:second,title:'Seconde intervention fictive',dates:[{date:'2026-10-20'}]})).status,201);
r=await api(0,'trainer_personal_missions?id=eq.'+id,'PATCH',{dates:[{date:'2026-10-22'}]});assert.equal(r.data[0].revision,3);
r=await api(0,'rpc/get_my_trainer_commitments_with_mission','POST',args);assert(r.data.some(row=>row.day==='2026-10-20'&&row.mission_id===second));assert(!r.data.some(row=>row.day==='2026-10-21'));
r=await api(0,'trainer_personal_missions?id=eq.'+id,'PATCH',{status:'cancelled'});assert(r.data[0].cancelled_at);
r=await api(0,'rpc/get_my_trainer_commitments_with_mission','POST',args);assert(r.data.some(row=>row.mission_id===second));assert(!r.data.some(row=>row.mission_id===id));
r=await api(0,'rpc/get_my_trainer_availability','POST',args);assert.equal(r.data.find(row=>row.day==='2026-10-20').status,'indispo');
fs.writeFileSync(root+'api-result.json',JSON.stringify({passed:true,checks:['Authenticated owner CRUD','foreign trainer and two OF cannot read or update','anonymous access denied','owner forgery denied','invalid date rejected','UUID duplication prevented','stale revision prevented','multidate commitments','date change and cancellation preserve other engagement and manual declaration']},null,2));
console.log('PASS: connected REST/RPC privacy, CRUD, revision, dates, cancellation and preserved manual availability.');
