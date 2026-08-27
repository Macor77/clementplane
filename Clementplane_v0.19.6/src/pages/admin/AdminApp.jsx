import { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminAccounts, getAdminDashboardStats, getAdminOrganizations, getAdminSupportRequests, getFeatureNewsHistory, isPlatformAdmin, previewFeatureNews, sendFeatureAnnouncement, updateAdminSupportRequest } from '../../services/adminService';
import './AdminApp.css';

const statusLabels = { new: 'Nouveau', in_progress: 'En cours', resolved: 'Résolu', closed: 'Clos' };
const priorityLabels = { low: 'Basse', normal: 'Normale', high: 'Haute', urgent: 'Urgente' };
const profileLabels = { organization: 'OF', trainer: 'Formateur', both: 'Double profil', other: 'Prospect' };

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function StatCard({ label, value, detail, explanation }) {
  return <div className="admin-card"><span>{label}</span><strong>{value ?? 0}</strong>{detail && <small>{detail}</small>}{explanation && <p className="admin-card-explanation">{explanation}</p>}</div>;
}


function MetricRow({ label, value, secondary }) {
  return <div className="admin-metric-row"><span>{label}</span><div><strong>{value ?? 0}</strong>{secondary && <small>{secondary}</small>}</div></div>;
}

function formatChartDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`));
}

function MiniLineChart({ title, data = [], cumulative = false, note }) {
  const values = data.map((p) => Number(p.value || 0));
  const max = Math.max(...values, 1); const min = cumulative ? 0 : Math.min(...values, 0);
  const width = 620, height = 150, pad = 18;
  const points = data.map((p,i) => { const x=pad+(i/Math.max(data.length-1,1))*(width-pad*2); const y=height-pad-((Number(p.value||0)-min)/Math.max(max-min,1))*(height-pad*2); return `${x},${y}`; }).join(' ');
  const summary = cumulative ? (values.at(-1) ?? 0) : values.reduce((sum, value) => sum + value, 0);
  const tickIndexes = data.length ? [...new Set([0, 7, 14, 21, data.length - 1].filter((i) => i < data.length))] : [];
  return <div className="admin-chart"><div className="admin-chart-head"><strong>{title}</strong><span>{summary}</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}><line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad}/><polyline points={points}/></svg><div className="admin-chart-axis admin-chart-axis--dates">{tickIndexes.map((i)=><span key={i}>{formatChartDate(data[i]?.date)}</span>)}</div><small className="admin-chart-summary">{cumulative ? 'Valeur cumulée à ce jour.' : 'Total créé sur les 30 derniers jours.'}</small>{note && <small className="admin-chart-note">{note}</small>}</div>;
}
function AdminHome() {
  const [stats,setStats]=useState(null); const [error,setError]=useState('');
  useEffect(()=>{getAdminDashboardStats().then(setStats).catch((err)=>setError(err.message||'Impossible de charger les statistiques.'))},[]);
  if(error)return <div className="admin-error">{error}</div>; if(!stats)return <div className="admin-loading-inline">Chargement des statistiques…</div>;
  const a=stats.accounts||{}, o=stats.organizations||{}, m=stats.missions||{}, av=stats.availability||{}, e=stats.emails||{}, su=stats.support||{}, u=stats.usage||{}, c=stats.curves||{};
  const responseRate=pct(m.responses,m.proposals_sent), acceptanceRate=pct(m.accepted,m.responses);
  const eventLabels={organization_dashboard_viewed:'Accueil OF',trainer_dashboard_viewed:'Accueil Formateur',trainer_search_viewed:'Recherche formateurs',missions_viewed:'Missions',planning_viewed:'Planning',availability_viewed:'Disponibilités',availability_share_viewed:'Partage des disponibilités',proposals_viewed:'Propositions',discover_viewed:'Découvrir Clementplane'};
  return <div><div className="admin-heading"><div><span className="admin-kicker">Pilotage interne</span><h1>Dashboard Admin</h1><p>Adoption, activité et croissance de Clementplane.</p></div><div className="admin-period">Temps réel · fenêtres glissantes 7 j / 30 j</div></div>
  <section className="admin-section"><div className="admin-section-title"><div><span className="admin-kicker">Adoption</span><h2>Base utilisateurs</h2></div></div><div className="admin-cards admin-cards--primary"><StatCard label="Utilisateurs" value={a.total} detail={`+${a.new_30d||0} sur 30 jours`} explanation={`${a.total||0} personnes possèdent un compte Clementplane.`}/><StatCard label="Utilisateurs OF" value={a.organization_profiles} explanation={`${a.organization_profiles||0} utilisateurs disposent d’un accès à un espace OF.`}/><StatCard label="Utilisateurs formateurs" value={a.claimed_trainers} explanation={`${a.claimed_trainers||0} utilisateurs disposent d’un profil formateur.`}/></div><div className="admin-inline-info"><strong>Dont {a.double_profiles||0} double{a.double_profiles===1?'':'s'} profil{a.double_profiles===1?'':'s'}</strong><span>{a.double_profiles||0} utilisateur{a.double_profiles===1?'':'s'} utilise{a.double_profiles===1?'':'nt'} Clementplane à la fois comme OF et comme formateur.</span></div><div className="admin-structure-info"><strong>{o.total||0} organismes enregistrés</strong><span>{o.total||0} structures disposent actuellement d’un espace OF dans Clementplane. +{o.new_30d||0} sur 30 jours.</span></div></section>
  <div className="admin-grid-2">
   <section className="admin-section"><div className="admin-section-title"><div><span className="admin-kicker">Activité récente</span><h2>Connexions sur 7 jours glissants</h2></div></div><div className="admin-metrics-grid"><StatCard label="Utilisateurs actifs" value={a.active_users_7d} detail={`${pct(a.active_users_7d,a.total)}% des utilisateurs`} explanation="Utilisateurs connectés au moins une fois au cours des 7 derniers jours."/><StatCard label="OF actifs" value={a.active_organizations_7d} detail={`${pct(a.active_organizations_7d,o.total)}% des OF`} explanation="OF dont au moins un utilisateur s’est connecté au cours des 7 derniers jours."/><StatCard label="Formateurs actifs" value={a.active_trainers_7d} detail={`${pct(a.active_trainers_7d,a.claimed_trainers)}% des formateurs`} explanation="Formateurs connectés au moins une fois au cours des 7 derniers jours."/><StatCard label="Dispos mises à jour manuellement" value={av.manual_active_30d} detail={`${pct(av.manual_active_30d,a.claimed_trainers)}% · 30 derniers jours`} explanation="Formateurs ayant eux-mêmes ajouté ou modifié une disponibilité ou indisponibilité."/></div></section>
   <section className="admin-section"><div className="admin-section-title"><div><span className="admin-kicker">Réseau privé OF</span><h2>Référencement formateurs</h2></div></div><div className="admin-metrics-grid"><StatCard label="Formateurs référencés par les OF" value={o.referenced_trainers_total} explanation={`Les OF ont ajouté ${o.referenced_trainers_total||0} formateurs à leurs listings au total.`}/><StatCard label="Moyenne par OF" value={o.avg_referenced_trainers} detail={`Médiane : ${o.median_referenced_trainers||0}`} explanation={`Chaque OF référence en moyenne ${o.avg_referenced_trainers||0} formateurs.`}/><StatCard label="OF ayant enrichi leur listing / 30 j" value={o.with_trainer_added_30d} detail={`${pct(o.with_trainer_added_30d,o.total)}% des OF`} explanation={`${o.with_trainer_added_30d||0} OF ont ajouté au moins un formateur ces 30 derniers jours.`}/><StatCard label="Taux de revendication" value={`${pct(a.claimed_trainers, o.referenced_trainers_total)}%`} detail={`${a.claimed_trainers||0} profils formateurs inscrits`} explanation="Part des fiches référencées qui correspondent aujourd’hui à un profil formateur inscrit."/></div></section>
  </div>
  <section className="admin-section admin-section--charts"><div className="admin-section-title"><div><span className="admin-kicker">Évolution</span><h2>30 derniers jours</h2></div><span className="admin-section-note">Les périodes 90 j / 12 mois viendront ensuite</span></div><div className="admin-charts-grid"><MiniLineChart title="Utilisateurs inscrits (cumul)" data={c.users} cumulative/><MiniLineChart title="Utilisateurs actifs (7 j glissants)" data={c.active_users_7d} note="Historique disponible à partir du démarrage de l’instrumentation 17.2."/><MiniLineChart title="Missions créées" data={c.missions}/><MiniLineChart title="Fiches formateurs créées" data={c.trainers_created}/><MiniLineChart title="Fiches formateurs revendiquées (cumul)" data={c.trainers_claimed} cumulative note="La date exacte de revendication n’était pas historisée avant ce correctif : les profils déjà revendiqués constituent le point de départ."/></div></section>
  <div className="admin-grid-2"><section className="admin-section"><div className="admin-section-title"><div><span className="admin-kicker">Missions</span><h2>Activité commerciale</h2></div></div><div className="admin-metrics-grid"><StatCard label="Missions créées" value={m.total} detail={`+${m.new_30d||0} sur 30 jours`}/><StatCard label="Propositions envoyées" value={m.proposals_sent} detail={`${m.viewed||0} consultées`}/><StatCard label="Réponses" value={m.responses} detail={`${responseRate}% des propositions`}/><StatCard label="Acceptées" value={m.accepted} detail={`${acceptanceRate}% des réponses`}/><StatCard label="Refusées" value={m.refused}/><StatCard label="Autres réponses / états" value={m.other_responses} detail="Explique l’écart éventuel du total"/></div></section>
  <section className="admin-section"><div className="admin-section-title"><div><span className="admin-kicker">Communication & support</span><h2>Qualité de service</h2></div></div><div className="admin-metrics-grid"><StatCard label="Partages dispos / 30 j" value={av.shares_30d}/><StatCard label="E-mails / 30 j" value={e.sent_30d} detail={`${e.delivered_30d||0} délivrés`} explanation={`${e.sent_30d||0} e-mails ont été envoyés par Clementplane ces 30 derniers jours.`}/><StatCard label="Échecs / 30 j" value={e.failed_30d} explanation="E-mails en échec, bloqués, invalides ou revenus en erreur."/><StatCard label="Demandes d’aide" value={su.total} detail={`${su.open||0} à traiter`}/></div></section></div>
  <section className="admin-section"><div className="admin-section-title"><div><span className="admin-kicker">Usage</span><h2>Fonctionnalités consultées</h2></div><span className="admin-section-note">30 derniers jours</span></div>{(u.by_event_30d||[]).length===0?<p className="admin-empty">Le suivi démarre avec le 17.2.</p>:<div className="admin-event-list">{u.by_event_30d.map(item=><div className="admin-event" key={item.event_name}><span>{eventLabels[item.event_name]||item.event_name}</span><div><strong>{item.users}</strong><small> utilisateur{item.users>1?'s':''} · {item.events} visite{item.events>1?'s':''}</small></div></div>)}</div>}</section>
  </div>;
}

function Crm() {
  const [rows, setRows] = useState([]); const [selected, setSelected] = useState(null); const [query, setQuery] = useState(''); const [status, setStatus] = useState('all');
  const reload = async () => setRows(await getAdminSupportRequests());
  useEffect(() => { reload(); }, []);
  const filtered = useMemo(() => rows.filter((r) => (status === 'all' || r.status === status) && `${r.requester_first_name||''} ${r.requester_last_name||''} ${r.requester_email} ${r.category} ${r.message}`.toLowerCase().includes(query.toLowerCase())), [rows, query, status]);
  return <div><div className="admin-heading"><div><span className="admin-kicker">Support & retours</span><h1>Mini-CRM</h1><p>{rows.length} demande{rows.length > 1 ? 's' : ''} centralisée{rows.length > 1 ? 's' : ''} depuis l’application et le site public.</p></div></div><div className="admin-toolbar"><input placeholder="Rechercher une demande…" value={query} onChange={(e)=>setQuery(e.target.value)} /><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="all">Tous les statuts</option>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Demandeur</th><th>Profil</th><th>Catégorie</th><th>Origine</th><th>Statut</th><th>Priorité</th></tr></thead><tbody>{filtered.map((r)=><tr key={r.id} onClick={()=>setSelected(r)}><td>{formatDate(r.created_at)}</td><td><strong>{[r.requester_first_name,r.requester_last_name].filter(Boolean).join(' ') || r.requester_email}</strong><small>{r.requester_email}</small></td><td>{profileLabels[r.requester_profile] || r.requester_profile}</td><td>{r.category}</td><td>{r.source === 'public' ? 'Site public' : 'Application'}</td><td><span className={`admin-pill admin-pill--${r.status}`}>{statusLabels[r.status]}</span></td><td>{priorityLabels[r.priority]}</td></tr>)}</tbody></table></div>{selected && <RequestPanel request={selected} onClose={()=>setSelected(null)} onSaved={async()=>{ await reload(); setSelected(null); }} />}</div>;
}

function RequestPanel({ request, onClose, onSaved }) {
  const [status, setStatus] = useState(request.status); const [priority, setPriority] = useState(request.priority); const [notes, setNotes] = useState(request.internal_notes || ''); const [saving,setSaving]=useState(false);
  const save = async () => { setSaving(true); try { await updateAdminSupportRequest(request.id,{status,priority,internalNotes:notes}); await onSaved(); } finally { setSaving(false); } };
  return <div className="admin-overlay" onMouseDown={onClose}><aside className="admin-panel" onMouseDown={(e)=>e.stopPropagation()}><button className="admin-panel-close" onClick={onClose}>×</button><span className="admin-kicker">Demande du {formatDate(request.created_at)}</span><h2>{request.category}</h2><p className="admin-contact">{[request.requester_first_name,request.requester_last_name].filter(Boolean).join(' ') || 'Demandeur'} · {request.requester_email}</p>{request.organization_name && <p><strong>OF :</strong> {request.organization_name}</p>}{request.trainer_name && <p><strong>Formateur :</strong> {request.trainer_name}</p>}<div className="admin-message">{request.message}</div><label>Statut<select value={status} onChange={(e)=>setStatus(e.target.value)}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Priorité<select value={priority} onChange={(e)=>setPriority(e.target.value)}>{Object.entries(priorityLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Notes internes<textarea rows="6" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Notes visibles uniquement dans l’Admin…" /></label><button className="admin-primary" disabled={saving} onClick={save}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button></aside></div>;
}

function Accounts() {
  const [rows,setRows]=useState([]); const [query,setQuery]=useState(''); useEffect(()=>{getAdminAccounts().then(setRows)},[]); const filtered=rows.filter((r)=>`${r.first_name||''} ${r.last_name||''} ${r.email||''} ${r.organization_names||''}`.toLowerCase().includes(query.toLowerCase()));
  return <div><div className="admin-heading"><div><span className="admin-kicker">Comptes</span><h1>Utilisateurs</h1><p>Consultation des comptes et de leur profil Clementplane.</p></div></div><div className="admin-toolbar"><input placeholder="Rechercher un utilisateur…" value={query} onChange={(e)=>setQuery(e.target.value)} /></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Inscription</th><th>Utilisateur</th><th>Profil</th><th>Organisme</th><th>État</th></tr></thead><tbody>{filtered.map((r)=><tr key={r.user_id}><td>{formatDate(r.created_at)}</td><td><strong>{[r.first_name,r.last_name].filter(Boolean).join(' ') || '—'}</strong><small>{r.email}</small></td><td>{r.has_organization && r.has_trainer ? 'Double profil' : r.has_organization ? 'OF' : r.has_trainer ? 'Formateur' : 'Compte seul'}</td><td>{r.organization_names || '—'}</td><td>{r.account_status}</td></tr>)}</tbody></table></div></div>;
}

function Communications() {
  const [subject,setSubject]=useState(''); const [message,setMessage]=useState('');
  const [audiences,setAudiences]=useState(['organization','trainer']); const [preview,setPreview]=useState(null);
  const [history,setHistory]=useState([]); const [busy,setBusy]=useState(false); const [notice,setNotice]=useState('');
  const toggle=(v)=>setAudiences((a)=>a.includes(v)?a.filter((x)=>x!==v):[...a,v]);
  const refresh=()=>getFeatureNewsHistory().then(setHistory).catch(()=>{});
  useEffect(()=>{refresh()},[]);
  useEffect(()=>{if(!audiences.length){setPreview(null);return;} previewFeatureNews(audiences).then(setPreview).catch(()=>setPreview(null))},[audiences]);
  const run=async(test)=>{if(!subject.trim()||!message.trim())return setNotice('Renseigne un objet et un message.');if(!test&&!audiences.length)return setNotice('Sélectionne au moins une population.');if(!test&&!window.confirm(`Envoyer cette nouveauté à ${preview?.eligible||0} destinataire(s) ?`))return;setBusy(true);setNotice('');try{const r=await sendFeatureAnnouncement({subject,message,audiences,test});setNotice(test?'E-mail test envoyé à ton adresse.':`Envoi terminé : ${r.sent} envoyé(s), ${r.failed} échec(s).`);if(!test)refresh();}catch(e){setNotice(e.message||'Envoi impossible.')}finally{setBusy(false)}};
  return <div><div className="admin-heading"><div><span className="admin-kicker">Communication utilisateurs</span><h1>Nouveautés Clementplane</h1><p>Informe les utilisateurs d’une nouvelle fonctionnalité sans toucher aux e-mails transactionnels.</p></div></div><div className="admin-communication-grid"><section className="admin-section"><h2>Préparer un e-mail</h2><p className="admin-help">Un utilisateur présent dans plusieurs populations ne reçoit qu’un seul e-mail.</p><label>Destinataires<div className="admin-audience-options"><label><input type="checkbox" checked={audiences.includes('organization')} onChange={()=>toggle('organization')}/> Utilisateurs OF</label><label><input type="checkbox" checked={audiences.includes('trainer')} onChange={()=>toggle('trainer')}/> Utilisateurs formateurs</label><label><input type="checkbox" checked={audiences.includes('both')} onChange={()=>toggle('both')}/> Doubles profils</label></div></label><div className="admin-recipient-preview"><strong>{preview?.eligible ?? '…'} destinataire(s) recevront cet e-mail</strong><span>{preview?.unsubscribed_selected ?? 0} utilisateur(s) sélectionné(s) sont désabonné(s) des nouveautés.</span></div><label>Objet<input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Ex. Nouveau : partagez vos disponibilités"/></label><label>Message<textarea rows="10" value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Explique simplement la nouveauté et son intérêt…"/></label><div className="admin-actions"><button className="admin-secondary" disabled={busy} onClick={()=>run(true)}>M’envoyer un test</button><button className="admin-primary" disabled={busy||!preview?.eligible} onClick={()=>run(false)}>{busy?'Envoi…':'Envoyer aux utilisateurs'}</button></div>{notice&&<div className="admin-notice">{notice}</div>}<p className="admin-help">Le désabonnement concerne uniquement les e-mails « Nouveautés Clementplane ». Les e-mails nécessaires au fonctionnement du service restent actifs.</p></section><section className="admin-section"><h2>Historique</h2>{!history.length?<p className="admin-help">Aucune communication envoyée pour le moment.</p>:<div className="admin-history">{history.map((h)=><div key={h.id} className="admin-history-item"><div className="admin-history-head"><strong>{h.subject}</strong><span>{formatDate(h.sent_at||h.created_at)}</span></div><p className="admin-history-message">{h.message}</p><div className="admin-history-meta"><span><strong>{h.sent_count}</strong> destinataire(s)</span>{h.failed_count>0&&<span>{h.failed_count} échec(s)</span>}<span>{(h.audiences||[]).map((x)=>x==='organization'?'OF':x==='trainer'?'Formateurs':'Doubles profils').join(' · ')}</span></div></div>)}</div>}</section></div></div>;
}

function Organizations() {
  const [rows,setRows]=useState([]); useEffect(()=>{getAdminOrganizations().then(setRows)},[]); return <div><div className="admin-heading"><div><span className="admin-kicker">Réseau Clementplane</span><h1>Organismes</h1><p>Vue de consultation des organismes présents sur la plateforme.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Création</th><th>Organisme</th><th>Membres</th><th>Formateurs du réseau</th><th>État</th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{formatDate(r.created_at)}</td><td><strong>{r.name}</strong></td><td>{r.member_count}</td><td>{r.trainer_count}</td><td>{r.status}</td></tr>)}</tbody></table></div></div>;
}

export default function AdminApp() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [allowed,setAllowed]=useState(null);

  useEffect(()=>{isPlatformAdmin().then(setAllowed).catch(()=>setAllowed(false))},[]);

  if (allowed === null) return <div className="admin-loading">Vérification de l’accès Admin…</div>;
  if (!allowed) return <Navigate to="/" replace />;

  let content;
  switch (location.pathname) {
    case '/admin':
    case '/admin/':
      content = <AdminHome />;
      break;
    case '/admin/crm':
      content = <Crm />;
      break;
    case '/admin/utilisateurs':
      content = <Accounts />;
      break;
    case '/admin/organismes':
      content = <Organizations />;
      break;
    case '/admin/communications':
      content = <Communications />;
      break;
    default:
      return <Navigate to="/admin" replace />;
  }

  return <div className="admin-shell"><aside className="admin-sidebar"><img src="/brand/clementplane-logo-light.svg" alt="Clementplane" /><span className="admin-sidebar-label">ADMINISTRATION</span><nav><NavLink end to="/admin">⌂ <span>Dashboard</span></NavLink><NavLink to="/admin/crm">✉ <span>Mini-CRM</span></NavLink><NavLink to="/admin/utilisateurs">♙ <span>Utilisateurs</span></NavLink><NavLink to="/admin/organismes">▣ <span>Organismes</span></NavLink><NavLink to="/admin/communications">✦ <span>Nouveautés</span></NavLink></nav><div className="admin-sidebar-footer"><a href="/">← Revenir à Clementplane</a><button onClick={signOut}>Se déconnecter</button></div></aside><main className="admin-main">{content}</main></div>;
}
