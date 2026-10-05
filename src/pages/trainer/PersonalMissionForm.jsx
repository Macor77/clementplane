import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPersonalMission, savePersonalMission } from '../../services/personalMissionService';
import { getMyTrainerOrganizations } from '../../services/trainerOrganizationsService';
import { getMyAgendaMissions } from '../../services/trainerAgendaService';
import { getMyTrainerAvailability } from '../../services/trainerAvailabilityService';
import { findMissionConflicts } from '../../utils/personalMissions';
import '../../styles/personalMissions.css';
const blank = () => ({title:'',formation:'',client_name:'',location:'',private_notes:'',fee:'',fee_unit:'mission',dates:[{date:'',heure_debut:'',heure_fin:''}]});
export default function PersonalMissionForm() {
  const {id}=useParams(); const navigate=useNavigate(); const stableId=useRef(id || crypto.randomUUID());
  const savingRef=useRef(false);
  const [form,setForm]=useState(blank); const [revision,setRevision]=useState(null);
  const [loading,setLoading]=useState(Boolean(id)); const [saving,setSaving]=useState(false);
  const [error,setError]=useState(''); const [loadError,setLoadError]=useState('');
  const [contacts,setContacts]=useState([]); const [missions,setMissions]=useState([]); const [manual,setManual]=useState([]);
  const [warning,setWarning]=useState(''); const [contactWarning,setContactWarning]=useState('');
  useEffect(()=>{
    let active=true;
    getMyTrainerOrganizations().then(rows=>{if(active)setContacts(rows);}).catch(()=>{if(active)setContactWarning('Carnet Mes OF indisponible : vous pouvez saisir le nom librement.');});
    getMyAgendaMissions().then(rows=>{if(active)setMissions(rows);}).catch(()=>{if(active)setWarning('La vérification des autres missions est indisponible. Consultez votre planning.');});
    if(id) getPersonalMission(id).then(row=>{
      if(!active)return;
      if(row.status==='cancelled'){setLoadError('Cette mission est annulée et ne peut plus être modifiée.');return;}
      setForm({...row,fee:row.fee ?? '',fee_unit:row.fee_unit || 'mission'});setRevision(row.revision);
    }).catch(e=>{if(active)setLoadError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[id]);
  const dateKey=form.dates.map(d=>d.date).filter(Boolean).sort().join(',');
  useEffect(()=>{
    let active=true; const days=dateKey.split(',').filter(Boolean);
    if(!days.length){setManual([]);return;}
    getMyTrainerAvailability({startDay:days[0],endDay:days.at(-1)}).then(rows=>{if(active)setManual(rows.filter(r=>days.includes(r.day)&&r.status==='indispo'));})
      .catch(()=>{if(active)setWarning('La vérification des indisponibilités est indisponible. Consultez votre planning.');});
    return()=>{active=false;};
  },[dateKey]);
  const set=(name,value)=>setForm(f=>({...f,[name]:value}));
  const dateSet=(index,name,value)=>setForm(f=>({...f,dates:f.dates.map((d,i)=>i===index?{...d,[name]:value}:d)}));
  const conflicts=findMissionConflicts(form.dates,missions,id);
  async function submit(event){
    event.preventDefault(); if(savingRef.current)return;
    savingRef.current=true;setSaving(true);setError('');
    try{const row=await savePersonalMission({id:stableId.current,revision,input:form});navigate(`/formateur/missions/personnelles/${row.id}`,{replace:true,state:{saved:true}});}
    catch(e){setError(e.message);}
    finally{savingRef.current=false;setSaving(false);}
  }
  return <div className="page-container personal-mission-page">
    <div className="page-heading"><div><p className="page-eyebrow">MISSION PERSONNELLE</p><h1>{id?'Modifier ma mission':'Ajouter une mission'}</h1><p>Votre intervention, même si votre client n’utilise pas Clementplane.</p></div></div>
    <Link to={id?`/formateur/missions/personnelles/${id}`:'/formateur/missions'}>← Retour aux missions</Link>
    {loading?<p role="status">Chargement…</p>:loadError?<p role="alert">{loadError}</p>:<form onSubmit={submit} className="personal-mission-form">
      <p className="personal-mission-info">Ces informations restent privées. Aucun contact ne reçoit de message. Une intervention, même courte, bloque la journée entière dans vos disponibilités partagées.</p>
      <fieldset disabled={saving}><legend>Votre intervention</legend>
        <label>Intitulé *<input required maxLength={200} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Ex. Formation SST — groupe du matin" /></label>
        <label>Formation<input maxLength={200} value={form.formation} onChange={e=>set('formation',e.target.value)} placeholder="Ex. SST, incendie…" /></label>
        {contacts.length>0&&<label>Reprendre un nom depuis Mes OF<select defaultValue="" onChange={e=>{const c=contacts.find(c=>c.id===e.target.value);if(c)set('client_name',c.organization_name);}}><option value="">Choisir un contact (facultatif)</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.organization_name}</option>)}</select><small>Seul le nom est copié ; aucun compte OF n’est associé à la mission.</small></label>}
        {contactWarning&&<p role="status">{contactWarning}</p>}
        <label>Donneur d’ordre ou client direct<input maxLength={200} value={form.client_name} onChange={e=>set('client_name',e.target.value)} /></label>
        <label>Lieu<input maxLength={500} value={form.location} onChange={e=>set('location',e.target.value)} placeholder="Adresse, ville ou visioconférence" /></label>
      </fieldset>
      <fieldset disabled={saving}><legend>Dates et horaires</legend><p>Au moins une date. Les horaires sont facultatifs ; si vous les précisez, renseignez le début et la fin.</p>
        {form.dates.map((d,i)=><div className="personal-mission-date" key={i}>
          <label>Date {i+1} *<input aria-label={`Date ${i+1}`} type="date" required min="2000-01-01" max="2100-12-31" value={d.date} onChange={e=>dateSet(i,'date',e.target.value)}/></label>
          <label>Début<input aria-label={`Début ${i+1}`} type="time" value={d.heure_debut||''} onChange={e=>dateSet(i,'heure_debut',e.target.value)}/></label>
          <label>Fin<input aria-label={`Fin ${i+1}`} type="time" value={d.heure_fin||''} onChange={e=>dateSet(i,'heure_fin',e.target.value)}/></label>
          <button type="button" className="button button--soft" aria-label={`Retirer la date ${i+1}`} disabled={form.dates.length===1} onClick={()=>set('dates',form.dates.filter((_,n)=>n!==i))}>Retirer</button>
        </div>)}
        <button type="button" className="button button--soft" disabled={form.dates.length>=100} onClick={()=>set('dates',[...form.dates,{date:'',heure_debut:'',heure_fin:''}])}>Ajouter une date</button>
      </fieldset>
      {(warning||manual.length>0||conflicts.length>0)&&<aside className="personal-mission-warning" role="status"><strong>Vérifiez votre disponibilité</strong>
        {warning&&<p>{warning}</p>}{manual.map(r=><p key={r.day}>Indisponibilité déjà déclarée le {r.day}.</p>)}
        {conflicts.map((c,i)=><p key={i}>Chevauchement le {c.date} avec « {c.mission.mission_title} »{c.mission.status==='accepte'?' (option)':''}.</p>)}
        <p>Vous pouvez enregistrer la mission ; les autres engagements sont conservés.</p></aside>}
      <fieldset disabled={saving}><legend>Informations privées (facultatif)</legend>
        <div className="personal-mission-fee"><label>Rémunération HT (€)<input type="number" min="0" max="99999999.99" step="0.01" value={form.fee} onChange={e=>set('fee',e.target.value)}/></label>
        <label>Unité<select value={form.fee_unit} onChange={e=>set('fee_unit',e.target.value)}><option value="mission">Pour la mission</option><option value="day">Par jour</option><option value="hour">Par heure</option></select></label></div>
        <label>Notes privées<textarea rows={4} maxLength={5000} value={form.private_notes} onChange={e=>set('private_notes',e.target.value)}/></label>
        <small>Mission confirmée ne signifie pas réalisée ou payée. Évitez les données sensibles sur les apprenants.</small>
      </fieldset>
      {error&&<div className="alert alert--error" role="alert">{error}</div>}
      <div className="personal-mission-actions"><button disabled={saving} className="button button--primary" type="submit">{saving?'Enregistrement…':id?'Enregistrer les modifications':'Enregistrer la mission'}</button><span>Connexion nécessaire pour enregistrer.</span></div>
    </form>}
  </div>;
}
