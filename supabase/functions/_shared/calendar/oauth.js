import {challenge} from './crypto.js';
export const CALENDAR_SCOPE='https://www.googleapis.com/auth/calendar.app.created';
export async function buildAuthorization({clientId,redirectUri,state,verifier}) {
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
 url.search=new URLSearchParams({client_id:clientId,redirect_uri:redirectUri,response_type:'code',scope:`openid email ${CALENDAR_SCOPE}`,access_type:'offline',prompt:'consent select_account',state,code_challenge:await challenge(verifier),code_challenge_method:'S256'}).toString();
 return url.href;
}
export function validateGrant(grant){
 if(!grant.scope?.split(' ').includes(CALENDAR_SCOPE))throw new Error('MISSING_CALENDAR_SCOPE');
 if(!grant.refresh_token)throw new Error('MISSING_REFRESH_TOKEN');
 if(!grant.access_token)throw new Error('MISSING_ACCESS_TOKEN');
}
export function validateReturn(state,userId,now=new Date()){
 if(!state||state.user_id!==userId||!(Date.parse(state.expires_at)>now.getTime()))throw new Error('INVALID_OAUTH_STATE');
}
export function publicStatus(row,mode='disabled') {
 return {mode,status:row?.status||'disconnected',account_email:row?.account_email||null,calendar_name:row?.calendar_id?'Clementplane':null,calendar_url:row?.calendar_id?`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(row.calendar_id)}`:null,last_success_at:row?.last_success_at||null,error_code:row?.error_code||null,include_fee:row?.include_fee===true,include_notes:row?.include_notes===true,pending:row?.status==='active'&&(row.dirty_version!==row.synced_version||!row.last_success_at)};
}
