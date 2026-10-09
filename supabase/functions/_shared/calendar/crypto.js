const encoder=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...bytes));
const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export const randomToken=()=>b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export async function sha256(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
export async function challenge(verifier){return b64(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(verifier)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function key(secret){
 const raw=bytes(secret.replace(/-/g,'+').replace(/_/g,'/'));
 if(raw.length!==32) throw new Error('INVALID_ENCRYPTION_KEY');
 return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
}
export async function seal(value,secret,owner){
 const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(owner)},await key(secret),encoder.encode(value));
 return `v1.${b64(iv)}.${b64(new Uint8Array(encrypted))}`;
}
export async function unseal(value,secret,owner){
 const [version,iv,payload]=value.split('.');if(version!=='v1')throw new Error('INVALID_CIPHERTEXT');
 return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:encoder.encode(owner)},await key(secret),bytes(payload)));
}
