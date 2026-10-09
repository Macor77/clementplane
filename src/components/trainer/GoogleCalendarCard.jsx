import {useCallback,useEffect,useRef,useState} from 'react';
import {calendarAction,googleCalendarEnabled} from '../../services/googleCalendarService';
import './GoogleCalendarCard.css';
const INTENT='cp_google_oauth_intent',RETURN='cp_google_oauth_return';
const errorMessages={authorization_revoked:'Google a retiré ou laissé expirer l’autorisation. Reconnectez votre compte.',google_temporarily_unavailable:'Google est temporairement indisponible. La reprise est automatique.',calendar_creation_uncertain:'La création du calendrier doit être vérifiée par le support avant toute nouvelle tentative.',foreign_event:'Un événement ne peut plus être identifié comme appartenant à Clementplane. Contactez le support.',managed_event_has_guests:'Des invités ont été ajoutés dans Google à un événement synchronisé. Retirez-les pour reprendre la synchronisation.',invalid_mission_date:'Une mission contient une date invalide. Corrigez-la dans Clementplane.',invalid_mission_time:'Une mission contient des horaires incohérents. Corrigez-les dans Clementplane.',synchronization_failed:'La synchronisation a rencontré une erreur. Relancez-la ou contactez le support.',revocation_unconfirmed:'L’accès conservé dans Clementplane a été supprimé. Vous pouvez également retirer Clementplane dans les autorisations de votre compte Google.'};
export default function GoogleCalendarCard({userId}){
 const [status,setStatus]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[confirm,setConfirm]=useState(false);
 const callbackStarted=useRef(false);
 const load=useCallback(async()=>{setStatus(await calendarAction('status'));},[]);
 useEffect(()=>{
  if(!googleCalendarEnabled)return;
  let cancelled=false;
  async function initialize(){
   try{
    const raw=sessionStorage.getItem(RETURN);
    if(raw&&!callbackStarted.current){
     callbackStarted.current=true;sessionStorage.removeItem(RETURN);
     const result=JSON.parse(raw),intent=JSON.parse(sessionStorage.getItem(INTENT)||'null');sessionStorage.removeItem(INTENT);
     if(result.error)throw new Error(result.error==='access_denied'?'Vous avez refusé l’autorisation Google. Aucun calendrier n’a été connecté.':'La connexion Google n’a pas abouti. Recommencez depuis cet écran.');
     if(!intent||intent.userId!==userId||intent.state!==result.state||intent.expires<Date.now())throw new Error('La connexion a expiré ou provient d’un autre navigateur. Recommencez ici.');
     await calendarAction('finish',{code:result.code,state:result.state});
     if(!cancelled)setMessage('Google est connecté. La première synchronisation va démarrer.');
    }
    const data=await calendarAction('status');if(!cancelled)setStatus(data);
   }catch(e){if(!cancelled)setError(e.message);}
  }
  void initialize();const timer=setInterval(()=>{if(!document.hidden)load().catch(()=>{});},15000);
  return()=>{cancelled=true;clearInterval(timer);};
 },[userId,load]);
 if(!googleCalendarEnabled)return null;
 async function run(fn){if(busy)return;setBusy(true);setError('');setMessage('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}}
 function connect(){return run(async()=>{
  const data=await calendarAction('start');sessionStorage.setItem(INTENT,JSON.stringify({state:data.state,userId,expires:Date.now()+600000}));window.location.assign(data.url);
 });}
 function preferences(field,value){return run(async()=>{
  const next=await calendarAction('settings',{include_fee:status.include_fee,include_notes:status.include_notes,[field]:value});setStatus(next);setMessage('Choix enregistré. Les événements seront actualisés, y compris pour retirer les informations désactivées.');
 });}
 const connected=status&&status.status!=='disconnected';
 return <section className="panel-card trainer-settings-card google-calendar-card" id="google-agenda" aria-labelledby="google-calendar-title">
  <div><p className="page-eyebrow">MON AGENDA</p><h2 id="google-calendar-title">Google Agenda</h2><p>Retrouvez vos propositions, options et missions dans un calendrier dédié « Clementplane », même quand l’application est fermée.</p></div>
  {status?.mode==='testing'&&<p className="google-calendar-notice">Accès de test : cette connexion n’est pas encore ouverte à tous. Google peut demander une nouvelle autorisation après 7 jours.</p>}
  {error&&<p role="alert" className="google-calendar-error">{error}</p>}
  {message&&<p role="status">{message}</p>}
  {!status?<p>Chargement… <button type="button" className="button button--soft" disabled={busy} onClick={()=>run(load)}>Actualiser</button></p>:<>
   {status.mode==='disabled'&&!connected?<p>La synchronisation Google n’est pas encore disponible pour votre compte.</p>:<>
    {status.account_email&&<p><strong>Compte Google :</strong> {status.account_email}</p>}
    {status.calendar_url&&<p><a href={status.calendar_url} target="_blank" rel="noreferrer">Ouvrir le calendrier Clementplane</a></p>}
    {status.last_success_at&&<p>Dernière synchronisation réussie : {new Date(status.last_success_at).toLocaleString('fr-FR')}</p>}
    {status.pending&&<p role="status">Synchronisation en attente. Vos missions restent enregistrées dans Clementplane.</p>}
    {errorMessages[status.error_code]&&<p role="status" className="google-calendar-notice">{errorMessages[status.error_code]}</p>}
    {connected?<>
     <fieldset disabled={busy}><legend>Informations facultatives copiées chez Google</legend>
      <label><input type="checkbox" checked={status.include_fee} onChange={e=>preferences('include_fee',e.target.checked)}/> Inclure la rémunération</label>
      <label><input type="checkbox" checked={status.include_notes} onChange={e=>preferences('include_notes',e.target.checked)}/> Inclure mes notes privées</label>
     </fieldset>
     <div className="google-calendar-actions">
      {status.status==='reconnect'?<button className="button" disabled={busy} onClick={connect}>Reconnecter Google</button>:<button className="button" disabled={busy||status.mode==='disabled'} onClick={()=>run(async()=>{setStatus(await calendarAction('sync'));setMessage('Synchronisation demandée.');})}>Relancer la synchronisation</button>}
      <button className="button button--soft" disabled={busy} onClick={()=>setConfirm(true)}>Déconnecter Google</button>
     </div>
    </>:<><p>Les événements conservés après une déconnexion ne sont plus actualisés. Reconnectez le même compte Google pour reprendre.</p><button className="button" disabled={busy||status.mode==='disabled'} onClick={connect}>Connecter Google</button></>}
   </>}
  </>}
  <details><summary>Ce qui sera copié et comment protéger votre calendrier</summary><p>Les informations de mission auxquelles vous avez accès sont copiées chez Google : formation, statut, client, donneur d’ordre, lieu, dates, horaires, contacts et consignes. La rémunération et vos notes privées restent exclues tant que vous ne les activez pas.</p>
   <p>Les propositions et options sont privées et marquées disponibles. Les missions confirmées sont privées et marquées occupées sur leurs horaires. Une journée sans horaires porte la mention « Horaires à préciser ». Clementplane conserve ses propres règles de disponibilité par journée.</p>
   <p>Le calendrier Clementplane possède ses propres paramètres de partage. Partager votre agenda principal ne partage pas automatiquement ce calendrier. Pour communiquer uniquement vos disponibilités à un OF, partagez ce calendrier avec le droit « Afficher uniquement les informations de disponibilité ».</p>
   <p>Certains droits avancés Google, notamment la modification et la gestion du calendrier, permettent de lire les événements privés. Clementplane ne peut pas garantir la confidentialité contre des droits plus larges que vous accordez. L’affichage peut varier selon les vues et les règles de votre organisation Google.</p>
   <p>Clementplane ne modifie pas vos partages et n’ajoute aucun invité. Vos rendez-vous personnels Google ne sont pas lus. Les modifications faites directement dans Google ne sont pas réimportées et peuvent être remplacées par la prochaine synchronisation. Pour modifier une mission, utilisez son lien vers Clementplane.</p>
   <p>Sur mobile ou en PWA, effectuez la connexion et son retour dans le même navigateur. Si Google ouvre un autre navigateur, recommencez depuis Clementplane dans ce navigateur.</p>
  </details>
  {confirm&&<div className="google-calendar-confirm" role="dialog" aria-modal="false" aria-label="Déconnecter Google Agenda"><p>Arrêter la synchronisation ? Le calendrier et son historique resteront dans Google, sans nouvelles mises à jour. Les autorisations conservées dans Clementplane seront supprimées.</p><div className="google-calendar-actions"><button className="button button--soft" disabled={busy} onClick={()=>setConfirm(false)}>Conserver la connexion</button><button className="button" disabled={busy} onClick={()=>run(async()=>{setStatus(await calendarAction('disconnect'));setConfirm(false);sessionStorage.removeItem(INTENT);setMessage('Google est déconnecté. Le calendrier a été conservé.');})}>Confirmer la déconnexion</button></div></div>}
 </section>;
}
