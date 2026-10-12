import {googleJson} from './google.js';
import {checked} from './repository.js';

export function calendarName(profile,trainer){
 const fullName=([profile?.first_name,profile?.last_name].filter(Boolean).join(' ').trim()
  ||[trainer?.prenom,trainer?.nom].filter(Boolean).join(' ').trim()).replace(/\s+/g,' ');
 return fullName?`${fullName} — Clementplane`:'Clementplane';
}
export async function userCalendarName(db,userId){
 const [profile,trainers]=await Promise.all([
  checked(db.from('profiles').select('first_name,last_name').eq('id',userId).maybeSingle()),
  checked(db.from('trainers').select('prenom,nom').eq('user_id',userId).limit(1)),
 ]);
 return calendarName(profile,trainers?.[0]);
}
export async function renameLegacyCalendar({fetch,token,calendarId,name}){
 if(name==='Clementplane')return;
 const url=`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`;
 const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
 const calendar=await googleJson(fetch,url,{method:'GET',headers});
 if(calendar.summary!=='Clementplane')return;
 // Preserve concurrent edits, events, timezone and every sharing setting.
 await googleJson(fetch,url,{method:'PATCH',headers:{...headers,...(calendar.etag?{'If-Match':calendar.etag}:{})},body:JSON.stringify({summary:name})});
}
