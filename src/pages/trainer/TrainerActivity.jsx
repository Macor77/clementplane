import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getActivityMissions, getMyActivityReports } from '../../services/trainerActivityService';
import { calculateActivity, parisToday } from '../../utils/trainerActivity';
import { missionHref } from '../../utils/personalMissions';
import '../../styles/trainerActivity.css';
function Metric({ title, value, detail }) { return <article><span>{title}</span><strong>{value}</strong><small>{detail}</small></article>; }
export default function TrainerActivity() {
  const { trainerProfile } = useAuth();
  const today = parisToday(), year = today.slice(0, 4);
  const [start, setStart] = useState(`${year}-01-01`), [end, setEnd] = useState(`${year}-12-31`);
  const [view, setView] = useState('realized'), [data, setData] = useState(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([getActivityMissions(), getMyActivityReports(trainerProfile?.id)]).then(([missions, reports]) => { if (active) { setData({ missions, reports }); setError(''); } }).catch(() => { if (active) setError('Impossible de charger les statistiques. Aucun total ne peut être confirmé.'); });
    return () => { active = false; };
  }, [trainerProfile?.id, attempt]);
  const stats = useMemo(() => data && start && end && start <= end ? calculateActivity(data.missions, data.reports, start, end, today) : null, [data, start, end, today]);
  const a = stats?.[view];
  return <div className="page-container activity-page"><p className="page-eyebrow">MON ACTIVITÉ</p><h1>Mes statistiques</h1><p>Vos missions personnelles et confiées par un OF. Seules les réalisations confirmées par vous alimentent l’activité réalisée.</p>
    <div className="activity-grid"><label>Début de période<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label><label>Fin de période<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label></div>
    {(!start || !end || start > end) && <p role="alert">Choisissez une période valide.</p>}
    <div className="activity-tabs" aria-label="Vue des statistiques"><button aria-pressed={view === 'realized'} onClick={() => setView('realized')}>Activité réalisée</button><button aria-pressed={view === 'future'} onClick={() => setView('future')}>Activité à venir</button></div>
    {error && <p role="alert">{error} <button onClick={() => setAttempt(v => v + 1)}>Réessayer</button></p>}{!data && !error && <p role="status">Chargement…</p>}
    {a && !error && <><h2>{view === 'realized' ? 'Réalisé confirmé' : 'À venir confirmé'}</h2><div className="activity-metrics">
      <Metric title="Missions" value={a.missions} detail="Une seule fois par vue et période." />
      <Metric title="Sessions" value={a.sessions} detail={view === 'realized' ? `${a.completed} terminées · ${a.partial} partiellement réalisées, dont ${a.ongoing} en cours avec dates futures.` : 'Un groupe peut suivre plusieurs journées.'} />
      <Metric title="Journées de session" value={a.days} detail="Trois groupes le même jour comptent trois journées de session." />
      <Metric title={view === 'realized' ? 'Heures réellement animées' : 'Heures pédagogiques prévues'} value={a.hours} detail={`${a.missingHours} journée(s) avec durée non renseignée. Les horaires ne sont pas assimilés à une durée pédagogique.`} />
      <Metric title={view === 'realized' ? 'Participations renseignées' : 'Participations prévues renseignées'} value={a.learners} detail={`${a.missingLearners} session(s) avec effectif non renseigné · ${a.learnersOutside} affectée(s) hors période / déjà commencée(s). Pas de décompte de personnes uniques.`} />
      {view === 'future' && <Metric title="Tarifs convenus totalisables" value={`${a.fees.HT} € HT · ${a.fees.TTC} € TTC`} detail={`${a.missingFees} mission(s) au tarif absent ou non totalisable · ${a.feesOutside} montant(s) affecté(s) à une autre période / déjà commencée(s).`} />}
    </div>{view === 'future' && <p>{stats.options} proposition(s) ou option(s) à venir, exclues des totaux confirmés.</p>}
      <section className="activity-pending"><h2>À compléter · {stats.pending.length} mission(s)</h2><p>Dates passées sans confirmation, durées réelles ou effectifs manquants sur la période sélectionnée.</p>{stats.pending.length ? <ul>{stats.pending.map(m => <li key={`${m.origin}:${m.mission_id}`}><Link to={m.report_id ? `/formateur/bilans/${m.report_id}` : `${missionHref(m)}#bilan`}>{m.mission_title || m.formation || 'Mission de formation'}</Link></li>)}</ul> : <p>Aucun bilan à compléter identifié sur cette période.</p>}</section>
      {stats.retained.length > 0 && <section className="activity-retained"><h2>Bilans conservés · {stats.retained.length}</h2><p>Ces missions ne figurent plus dans vos affectations. Leurs bilans restent consultables et modifiables sur la période sélectionnée.</p><ul>{stats.retained.map(m => <li key={m.report_id}><Link to={`/formateur/bilans/${m.report_id}`}>{m.mission_title}</Link></li>)}</ul></section>}
    </>}
    <details><summary>Comprendre les règles de comptage</summary><p>Les heures sont affectées à la date de chaque journée. Une session et une mission peuvent apparaître dans plusieurs périodes : leurs nombres ne s’additionnent pas entre périodes.</p><p>Les participations réelles sont affectées une seule fois, à la première journée réalisée de la session. Les effectifs prévus sont affectés à la première date de session ; un groupe déjà commencé n’est pas recompté dans le futur. Corriger la première date peut donc déplacer l’effectif d’une période à une autre.</p><p>Le tarif total convenu connu est affecté à la première date contractuelle de la mission. Aucun montant n’est réparti par journée ; les unités jour/heure et les montants sans HT/TTC ne sont pas additionnés. Une session traversant deux années répartit ses heures, mais conserve son effectif et le montant de mission dans leur période d’affectation.</p><p>Une journée passée non renseignée ne compte ni comme réalisée ni comme future. Une date d’aujourd’hui non renseignée reste à venir. Aucun calcul de bénéfice, de facturation ou d’export BPF.</p></details>
  </div>;
}
