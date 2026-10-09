const TITLES = {proposition_envoyee:'Proposition à répondre',accepte:'Option en attente de confirmation',affecte:'Mission confirmée',confirmed:'Mission confirmée'};
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = value => String(value ?? '').trim();
export function localDay(now = new Date(), timeZone = 'Europe/Paris') {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export async function eventId(owner,key,generation=0) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([owner,key,generation])));
  return 'cp'+Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
}
function datesFor(day,timeZone) {
  const parsed=new Date(`${day.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==day.date) throw new Error('INVALID_MISSION_DATE');
  const start=clean(day.heure_debut),end=clean(day.heure_fin);
  const valid=t=>/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t);
  if(start&&end) {
    if(!valid(start)||!valid(end)||start>=end) throw new Error('INVALID_MISSION_TIME');
    return {start:{dateTime:`${day.date}T${start.length===5?start+':00':start}`,timeZone},end:{dateTime:`${day.date}T${end.length===5?end+':00':end}`,timeZone}};
  }
  parsed.setUTCDate(parsed.getUTCDate()+1);
  return {start:{date:day.date},end:{date:parsed.toISOString().slice(0,10)}};
}
/** Projection whitelist. Never pass raw mission records directly to a provider. */
export function projectEvents(rows,{now=new Date(),firstDay,trackedKeys=new Set(),appUrl,owner,includeFee=false,includeNotes=false,timeZone='Europe/Paris'}) {
  const originUrl=new URL(appUrl);
  if(originUrl.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(originUrl.hostname)) throw new Error('INVALID_APP_URL');
  const result=new Map();
  for(const source of rows) {
    let r={...source};
    if(['annule','annulee','cancelled'].includes(r.mission_status)) continue;
    if(!TITLES[r.status]) continue;
    if(r.status==='proposition_envoyee'&&(!r.proposed_at||!r.expires_at||!(Date.parse(r.expires_at)>now.getTime()))) continue;
    const change=r.pending_change;
    if(change?.request_status==='pending'&&['refused','unavailable'].includes(change.response_status)) continue;
    const pending=change?.request_status==='pending'&&change.response_status==='pending';
    if(pending) {
      const old=change.previous_mission;
      if(!old||!Array.isArray(change.previous_dates)) throw new Error('MISSING_ACCEPTED_SNAPSHOT');
      r={...r,formation:old.formation,location:old.lieu,address:old.adresse,postal_code:old.code_postal,city:old.ville,offered_fee:old.cout_formateur,dates:change.previous_dates,status:change.previous_status};
      if(!TITLES[r.status]) throw new Error('INVALID_ACCEPTED_STATUS');
    }
    const personal=r.origin==='personal';
    const formation=clean(r.formation)||clean(r.mission_title)||clean(r.title)||'Formation';
    const label=TITLES[r.status];
    const path=personal?`/formateur/missions/personnelles/${encodeURIComponent(r.mission_id)}`:`/formateur/missions/${encodeURIComponent(r.mission_id)}`;
    const url=new URL(path,originUrl).href;
    const location=personal?(clean(r.location)||[r.site_name,r.address,[r.postal_code,r.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')):[r.location,r.address,[r.postal_code,r.city].filter(Boolean).join(' ')].map(clean).filter((x,i,a)=>x&&a.indexOf(x)===i).join(', ');
    if(!Array.isArray(r.dates)) throw new Error('INVALID_MISSION_DATES');
    if(!r.dates.length) throw new Error('INCOMPLETE_MISSION_DATES');
    for(const day of r.dates) {
      const key=`${r.origin}:${r.mission_id}:${day.date}`;
      const timing=datesFor(day,timeZone);
      if(day.date<firstDay&&!trackedKeys.has(key)) continue;
      const lines=[`Formation : ${esc(formation)}`,`Statut : ${esc(label)}`];
      if(pending) lines.push('Modification à revalider dans Clementplane. Les dates et conditions ci-dessous sont celles de votre engagement précédent ; les nouvelles conditions ne sont pas encore acceptées.');
      for(const [name,value] of [['Client final',personal?r.title:r.client],['Donneur d’ordre',personal?r.client_name:r.organization_name],['Lieu',location],['Date',day.date],['Horaires',timing.start.date?'Horaires à préciser':`${day.heure_debut} – ${day.heure_fin} (${timeZone})`],['Contact',r.contact_name],['E-mail',r.contact_email],['Téléphone',r.contact_phone],['Informations pratiques',personal?'':r.mission_notes]]) {
        if(clean(value)) lines.push(`${name} : ${esc(value)}`);
      }
      const fee=personal?r.fee:r.offered_fee;
      if(includeFee&&fee!=null) lines.push(`Rémunération : ${esc(fee)} € HT${personal&&r.fee_unit?' / '+esc({day:'jour',hour:'heure',mission:'mission'}[r.fee_unit]||r.fee_unit):''}`);
      if(includeNotes&&personal&&r.private_notes) lines.push(`Notes privées : ${esc(r.private_notes)}`);
      lines.push('Mission synchronisée depuis Clementplane',`<a href="${esc(url)}">Consulter la mission dans Clementplane</a>`);
      if(result.has(key)) throw new Error('DUPLICATE_MISSION_DAY');
      result.set(key,{key,summary:`${label} — ${formation}${pending?' — Modification à revalider':''}`,description:lines.join('\n'),location,...timing,status:'confirmed',visibility:'private',transparency:['affecte','confirmed'].includes(r.status)?'opaque':'transparent',attendees:[],reminders:{useDefault:false},guestsCanInviteOthers:false,guestsCanModify:false,guestsCanSeeOtherGuests:false,source:{title:'Clementplane',url},extendedProperties:{private:{clementplaneOwner:owner,clementplaneKey:key}}});
    }
  }
  return result;
}
