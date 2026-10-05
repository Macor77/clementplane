import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { cancelPersonalMission, getPersonalMission } from '../../services/personalMissionService';
import { feeUnitLabels } from '../../utils/personalMissions';
import '../../styles/personalMissions.css';
export default function PersonalMissionDetail(){
 const {id}=useParams();const location=useLocation();const busy=useRef(false);
 const [mission,setMission]=useState(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [confirm,setConfirm]=useState(false);
 useEffect(()=>{let active=true;getPersonalMission(id).then(row=>{if(active)setMission(row);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[id]);
 async function cancel(){if(busy.current)return;busy.current=true;setSaving(true);setError('');try{setMission(await cancelPersonalMission(id,mission.revision));setConfirm(false);}catch(e){setError(e.message);}finally{busy.current=false;setSaving(false);}}
 return <div className="page-container personal-mission-page"><Link to="/formateur/missions">← Mes missions</Link>
 {loading&&<p role="status">Chargement…</p>}{error&&<p className="alert alert--error" role="alert">{error}</p>}
 {mission&&<><div className="page-heading"><div><p className="page-eyebrow">MISSION PERSONNELLE · PRIVÉE</p><h1>{mission.title}</h1><p>{mission.status==='cancelled'?'Annulée':'Mission confirmée'}</p></div></div>
 {location.state?.saved&&mission.status!=='cancelled'&&<p role="status">Mission enregistrée.</p>}
 <section className="personal-mission-card"><dl>
 {[["Formation",mission.formation],["Donneur d’ordre / client",mission.client_name],["Lieu",mission.location],["Rémunération",mission.fee==null?'Non renseignée':`${mission.fee} € HT / ${feeUnitLabels[mission.fee_unit]}`]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Non renseigné'}</dd></div>)}
 </dl><h2>Dates et horaires</h2><ul>{[...mission.dates].sort((a,b)=>a.date.localeCompare(b.date)).map(d=><li key={d.date}>{new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date(`${d.date}T12:00:00`))} · {d.heure_debut?`${d.heure_debut} – ${d.heure_fin}`:'Horaires non renseignés'}</li>)}</ul>
 <h2>Notes privées</h2><p className="personal-mission-notes">{mission.private_notes||'Aucune note.'}</p>
 <p className="personal-mission-info">Les autres OF voient uniquement votre indisponibilité à la journée. Aucun détail de cette mission ne leur est communiqué. Aucun message n’est envoyé au client.</p>
 <p>Créée le {new Date(mission.created_at).toLocaleString('fr-FR')} · Mise à jour le {new Date(mission.updated_at).toLocaleString('fr-FR')}</p>
 {mission.cancelled_at&&<p role="status">Annulée le {new Date(mission.cancelled_at).toLocaleString('fr-FR')}. Les autres engagements et disponibilités déclarées restent conservés.</p>}
 </section>
 {mission.status==='confirmed'&&<div className="personal-mission-actions"><Link className="button button--primary" to={`/formateur/missions/personnelles/${id}/modifier`}>Modifier</Link><button className="button button--soft" onClick={()=>setConfirm(true)}>Annuler la mission</button></div>}
 {confirm&&<section className="personal-mission-warning" aria-label="Confirmation d’annulation"><h2>Confirmer l’annulation ?</h2><p>La mission restera dans votre historique et ne bloquera plus ses journées. L’annulation ne peut pas être annulée.</p><div className="personal-mission-actions"><button className="button button--primary" disabled={saving} onClick={cancel}>{saving?'Annulation…':'Confirmer l’annulation'}</button><button className="button button--soft" disabled={saving} onClick={()=>setConfirm(false)}>Conserver la mission</button></div></section>}
 </>}
 </div>;
}
