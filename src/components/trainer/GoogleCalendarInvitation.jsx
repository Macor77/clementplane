import {useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {calendarAction,googleCalendarEnabled} from '../../services/googleCalendarService';
import {getMyAgendaMissions} from '../../services/trainerAgendaService';
import {shouldInviteGoogle} from '../../utils/googleCalendarInvitation';

export default function GoogleCalendarInvitation(){
 const {user}=useAuth();const location=useLocation();
 const [visibleFor,setVisibleFor]=useState(null);
 const [missionVersion,setMissionVersion]=useState(0);
 useEffect(()=>{
  const refresh=()=>setMissionVersion(version=>version+1);
  window.addEventListener('cp-mission-accepted',refresh);
  return()=>window.removeEventListener('cp-mission-accepted',refresh);
 },[]);
 const key=user?.id?`cp_google_invitation_dismissed:${user.id}`:null;
 useEffect(()=>{
  let active=true;
  setVisibleFor(null);
  if(!googleCalendarEnabled||!key||location.pathname==='/formateur/parametres')return;
  let dismissed=false;try{dismissed=localStorage.getItem(key)==='true';}catch{/* Storage may be unavailable. */}
  if(dismissed)return;
  Promise.all([calendarAction('status'),getMyAgendaMissions()]).then(([status,missions])=>{
   if(active&&shouldInviteGoogle(status,missions,dismissed))setVisibleFor(user.id);
  }).catch(()=>{/* A failed optional invitation never blocks a mission. */});
  return()=>{active=false;};
 },[key,user?.id,location.key,location.pathname,missionVersion]);
 function dismiss(){try{localStorage.setItem(key,'true');}catch{/* Hide for this visit even without storage. */}setVisibleFor(null);}
 if(!user?.id||visibleFor!==user.id)return null;
 return <section className="panel-card trainer-settings-card" aria-labelledby="google-invitation-title" style={{marginBottom:20}}>
  <h2 id="google-invitation-title">Vos missions dans Google Agenda</h2>
  <p>Retrouvez automatiquement vos propositions, options et missions dans un calendrier séparé « Prénom Nom — Clementplane ». Votre agenda personnel reste inchangé.</p>
  <p>La connexion est facultative. La rémunération et les notes privées sont exclues par défaut.</p>
  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
   <Link className="button button--primary" to="/formateur/parametres#google-agenda">Connecter Google Agenda</Link>
   <button type="button" className="button button--soft" onClick={dismiss}>Plus tard</button>
  </div>
  <p>Vous pourrez retrouver ce choix dans Paramètres → Google Agenda.</p>
 </section>;
}
