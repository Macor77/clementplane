import fs from 'node:fs';import assert from 'node:assert/strict';
const root=process.env.E2E_PERSONAL_DATA_DIR;
if(!root?.endsWith('/')) throw new Error('E2E_PERSONAL_DATA_DIR must name an isolated fixture directory ending with /');
const c=JSON.parse(fs.readFileSync(root+'credentials.json'));const k=JSON.parse(fs.readFileSync(root+'public-key.json'));const s=JSON.parse(fs.readFileSync(root+'sessions.json'));
if(c.project==='hctvkynrgmnxjynbncdi'||c.project!==process.env.E2E_PROJECT_REF||k.url!==`https://${c.project}.supabase.co`) throw new Error('Refuse production or mismatched test project');
async function api(actor,path,body){const r=await fetch(k.url+'/rest/v1/'+path,{method:body===undefined?'GET':'POST',headers:{apikey:k.key,Authorization:'Bearer '+s[actor].access_token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();assert(r.ok,JSON.stringify({path,status:r.status,data}));return data;}
const range={p_trainer_ids:[c.trainers[0]],p_start_day:'2026-10-01',p_end_day:'2026-10-31',p_exclude_mission_id:null,p_organization_id:c.orgs[0]};
let rows=await api(2,'rpc/get_trainer_mission_commitments_safe',range);assert(rows.some(r=>r.mission_id===null&&r.is_own_organization===false&&r.dates.includes('2026-10-20')));assert(!JSON.stringify(rows).includes('privée'));
await api(0,'rpc/respond_to_my_mission_proposal',{p_mission_formateur_id:c.relation,p_response:'accepte',p_comment:'Recette fictive'});
await api(2,'rpc/assign_mission_trainer',{p_mission_id:c.mission,p_formateur_id:c.trainers[0]});
rows=await api(0,'rpc/get_my_mission_proposals',{});assert.equal(rows.find(r=>r.mission_id===c.mission).status,'affecte');
rows=await api(2,'rpc/get_trainer_mission_commitments_safe',range);assert(rows.some(r=>r.mission_id===c.mission&&r.is_own_organization));assert(rows.some(r=>r.mission_id===null&&!r.is_own_organization));
rows=await api(3,'rpc/get_trainer_mission_commitments_safe',{...range,p_organization_id:c.orgs[1]});assert(rows.every(r=>r.mission_id===null&&!r.is_own_organization));
// A dual-space user retains their private mission, but cannot acquire another trainer's data.
rows=await api(0,'trainer_personal_missions?select=id,owner_user_id');assert(rows.every(r=>r.owner_user_id===c.users[0]));
assert.deepEqual(await api(3,'trainer_personal_missions?select=id'),[]);
const change=await api(2,'rpc/request_mission_change',{p_mission_id:c.mission,p_immediate_changes:{intitule:'Mission OF fictive v0211',client:'Client fictif'},p_proposed_mission:{formation:'SST fictif',lieu:'Lieu fictif modifié'},p_proposed_dates:[{date:'2026-10-20',heure_debut:'10:00',heure_fin:'16:00'}]});
const pending=await api(0,'rpc/get_my_pending_mission_change',{p_mission_id:c.mission});assert(pending.length>0);
await api(0,'rpc/respond_to_my_mission_change',{p_request_id:change,p_response:'accepted',p_comment:'Recette fictive'});
await api(2,'rpc/assign_mission_trainer',{p_mission_id:c.mission,p_formateur_id:c.trainers[0]});
await api(2,'rpc/cancel_mission_with_trainers',{p_mission_id:c.mission,p_channel:'other',p_note:'Recette automatisée fictive, aucun message envoyé'});
rows=await api(0,'rpc/get_my_trainer_commitments_with_mission',{p_start_day:'2026-10-01',p_end_day:'2026-10-31'});assert(!rows.some(r=>r.mission_id===c.mission));assert(rows.some(r=>r.mission_id===c.secondPersonal));
fs.writeFileSync(root+'of-result.json',JSON.stringify({passed:true,checks:['Neutral OF availability','proposal acceptance with personal overlap','OF assignment','cross OF privacy','double-space owner separation','mission change revalidation','OF cancellation preserves personal engagement']},null,2));console.log('PASS: connected OF acceptance/assignment/revalidation/cancellation, neutral privacy, dual-space and personal engagement preservation.');
