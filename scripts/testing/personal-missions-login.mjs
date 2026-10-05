// Explicit opt-in to a disposable non-production fixture set. Never log credentials.
import fs from 'node:fs';
const root=process.env.E2E_PERSONAL_DATA_DIR;
if(!root?.endsWith('/')) throw new Error('E2E_PERSONAL_DATA_DIR must end with /');
const c=JSON.parse(fs.readFileSync(root+'credentials.json'));
const k=JSON.parse(fs.readFileSync(root+'public-key.json'));
if(c.project==='hctvkynrgmnxjynbncdi'||c.project!==process.env.E2E_PROJECT_REF||k.url!==`https://${c.project}.supabase.co`) throw new Error('Refuse production or mismatched test project');
const sessions=[];
for(const email of c.emails){
 const r=await fetch(k.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:k.key,'Content-Type':'application/json'},body:JSON.stringify({email,password:c.password})});
 if(!r.ok)throw new Error(`Fixture login failed: HTTP ${r.status}`);
 sessions.push(await r.json());
}
fs.writeFileSync(root+'sessions.json',JSON.stringify(sessions),{mode:0o600});
console.log('Isolated test sessions renewed.');
