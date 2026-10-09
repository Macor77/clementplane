export class GoogleError extends Error {
 constructor(status,reason='google_error',retryAfter=0){
  super(`GOOGLE_${status}_${['invalid_grant','rateLimitExceeded','userRateLimitExceeded','quotaExceeded','forbidden','conflict','timeout'].includes(reason)?reason:'error'}`);
  this.status=status;this.reason=reason;this.retryAfter=retryAfter;this.retryable=status===412||status===429||status>=500||(status===403&&['rateLimitExceeded','userRateLimitExceeded','quotaExceeded'].includes(reason));
 }
}
export const retryDelay=(attempt,random=Math.random)=>Math.min(3600,Math.round(30*2**Math.min(attempt,7)*(0.5+random())));
export async function googleJson(fetch,url,options={}) {
 let response;
 try{response=await fetch(url,{...options,signal:AbortSignal.timeout(10000)});}catch{throw new GoogleError(503,'timeout');}
 let json={};try{json=await response.json();}catch{/* Empty successful DELETE bodies. */}
 if(!response.ok) {
  const reason=typeof json.error==='string'?json.error:json.error?.errors?.[0]?.reason;
  throw new GoogleError(response.status,reason,Math.min(86400,Number(response.headers.get('Retry-After'))||0));
 }
 return json;
}
export class GoogleCalendar {
 constructor({fetch,token,calendarId}){this.fetch=fetch;this.token=token;this.calendarId=calendarId;}
 async request(method,path,body,etag){
  const headers={Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'};if(etag)headers['If-Match']=etag;
  return googleJson(this.fetch,`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events${path}`,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
 }
 async get(id){try{return await this.request('GET',`/${encodeURIComponent(id)}`);}catch(e){if([404,410].includes(e.status))return null;throw e;}}
 body(event){const {key:_,...body}=event;return body;}
 insert(id,event){return this.request('POST','?sendUpdates=none',{...this.body(event),id});}
 update(id,event,etag){return this.request('PUT',`/${encodeURIComponent(id)}?sendUpdates=none`,this.body(event),etag);}
 async remove(id,etag){try{return await this.request('DELETE',`/${encodeURIComponent(id)}?sendUpdates=none`,null,etag);}catch(e){if([404,410].includes(e.status))return;throw e;}}
}
