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
      <Metric title="Sessions" value={a.sessions} detail={view === 'realized' ? `${a.completed} terminées · ${a.partial} partiellement réalisées, dont ${a.ongoing} en cours avec dates futures.` : 'Une mission correspond à une session et un groupe.'} />
      {view === 'realized' ? <>
        <Metric title="Jours réellement animés" value={a.reportedDays} detail={`${a.missingReportedDays} bilan(s) sans durée en jours, dont les anciens bilans détaillés.`} />
        <Metric title="Heures réellement animées" value={a.hours} detail={`${a.missingHours} durée(s) non renseignée(s).`} />
        <Metric title="Apprenants entièrement formés" value={a.fullyTrainedLearners} detail="Hors présences partielles renseignées dans les bilans simplifiés." />
        <Metric title="Apprenants partiellement formés" value={a.partialLearners} detail="Présences avec une durée propre, comptées séparément des apprenants entièrement formés." />
        <Metric title="Total des participants" value={a.learners} detail={`${a.missingLearners} effectif(s) non renseigné(s) · ${a.learnersOutside} effectif(s) historique(s) affecté(s) hors période. ${a.historicalLearners} participant(s) d’anciens bilans détaillés sans distinction de présence complète ou partielle. Pas de décompte de personnes uniques entre missions.`} />
      </> : <Metric title="Dates prévues" value={a.days} detail="Dates des missions confirmées. Une date ne correspond pas nécessairement à une journée entière." />}
      {view === 'future' && <Metric title="Tarifs convenus totalisables" value={`${a.fees.HT} € HT · ${a.fees.TTC} € TTC`} detail={`${a.missingFees} mission(s) au tarif absent ou non totalisable · ${a.feesOutside} montant(s) affecté(s) à une autre période / déjà commencée(s).`} />}
    </div>{view === 'future' && <p>{stats.options} proposition(s) ou option(s) à venir, exclues des totaux confirmés.</p>}
      <section className="activity-pending"><h2>À compléter · {stats.pending.length} mission(s)</h2><p>Dates passées sans confirmation, durées réelles ou effectifs manquants sur la période sélectionnée.</p>{stats.pending.length ? <ul>{stats.pending.map(m => <li key={`${m.origin}:${m.mission_id}`}><Link to={m.report_id ? `/formateur/bilans/${m.report_id}` : `${missionHref(m)}#bilan`}>{m.mission_title || m.formation || 'Mission de formation'}</Link></li>)}</ul> : <p>Aucun bilan à compléter identifié sur cette période.</p>}</section>
      {stats.retained.length > 0 && <section className="activity-retained"><h2>Bilans conservés · {stats.retained.length}</h2><p>Ces missions ne figurent plus dans vos affectations. Leurs bilans restent consultables et modifiables sur la période sélectionnée.</p><ul>{stats.retained.map(m => <li key={m.report_id}><Link to={`/formateur/bilans/${m.report_id}`}>{m.mission_title}</Link></li>)}</ul></section>}
    </>}
    <details><summary>Comprendre les règles de comptage</summary><p>Les apprenants entièrement formés et les présences partielles sont comptés séparément. Le total des participants les additionne sans doublon. Les heures réellement animées restent celles du formateur ; les durées des présences partielles sont conservées dans les bilans, sans être ajoutées à ce temps.</p><p>Pour les bilans simplifiés, les totaux réels (session, apprenants, jours et heures) sont comptés une seule fois à la première date de référence. Pour un ancien bilan converti, la première date réalisée est conservée. Une session à cheval sur deux années reste donc rattachée à une seule période. Aucun total n’est réparti arbitrairement entre les journées.</p><p>Les bilans historiques détaillés conservent leurs heures par date et leur effectif à la première date réalisée de chaque groupe. Leur nombre de jours réellement animés reste inconnu : les dates ne permettent pas de déduire les demi-journées.</p><p>L’activité à venir repose sur les dates des missions confirmées, sans effectif ni durée pédagogique prévisionnels. Une journée passée non renseignée ne compte pas comme réalisée.</p><p>Le tarif total convenu connu est affecté à la première date contractuelle de la mission. Les tarifs à la journée ou à l’heure et les montants sans HT/TTC ne sont pas additionnés. Aucun calcul de bénéfice, de facturation ou d’export BPF.</p></details>
  </div>;
}
