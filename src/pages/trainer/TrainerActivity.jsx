import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getActivityMissions, getMyActivityExpenses, getMyActivityReports } from '../../services/trainerActivityService';
import { parisToday } from '../../utils/trainerActivity';
import { buildStatistics, dateLabel, numberLabel, periodPreset, statisticsEntries } from '../../utils/trainerStatistics';
import { EXPENSE_CATEGORIES, formatExpenseCents } from '../../utils/trainerExpenses';
import ActivityHelp from '../../components/trainer/ActivityHelp';
import StatisticsDetails, { StatisticsRows } from '../../components/trainer/StatisticsDetails';
import ActivityTrend from '../../components/trainer/ActivityTrend';
import MonthlyActivityGoal from '../../components/trainer/MonthlyActivityGoal';
import '../../styles/trainerActivity.css';
import '../../styles/trainerStatistics.css';

function Metric({ title, value, help, onClick, warning, onWarning, className = '' }) {
  return <article className={className}><div className="statistics-metric-heading"><span>{title}</span><ActivityHelp title={title}>{help}</ActivityHelp></div>
    <button className="statistics-metric-value" onClick={onClick} aria-label={`Voir le détail : ${title}`}><strong>{value}</strong><span className="statistics-detail-link">Voir le détail <span aria-hidden="true">›</span></span></button>
    {warning && <button className="statistics-warning" onClick={onWarning}>{warning}</button>}
  </article>;
}
function Dashboard({ owner, trainerId }) {
  const today = parisToday();
  const [preset, setPreset] = useState('month'), [period, setPeriod] = useState(() => periodPreset('month', today));
  const [view, setView] = useState('realized'), [data, setData] = useState(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState({ organization: '', formation: '' }), [detail, setDetail] = useState(null), [allPending, setAllPending] = useState(false);
  const { start, end } = period;
  useEffect(() => {
    let active = true; setData(null); setError('');
    Promise.all([getActivityMissions(), getMyActivityReports(trainerId), getMyActivityExpenses(owner)]).then(([missions, reports, expenses]) => {
      if (active) setData(statisticsEntries(missions, reports, expenses));
    }).catch(() => { if (active) setError('Impossible de charger les statistiques. Aucun total ne peut être confirmé.'); });
    return () => { active = false; };
  }, [trainerId, owner, attempt]);
  const validPeriod = /^20\d{2}-\d{2}-\d{2}$/.test(start) && /^20\d{2}-\d{2}-\d{2}$/.test(end) && start <= end;
  const calculated = useMemo(() => {
    if (!data || !validPeriod) return {};
    try { return { stats: buildStatistics(data, start, end, today, filters) }; } catch { return { calculationError: 'Les données ne permettent pas de confirmer ces totaux. Réessayez ou réduisez la période.' }; }
  }, [data, validPeriod, start, end, today, filters]);
  const { stats, calculationError } = calculated;
  const a = stats?.[view], finance = stats?.finance;
  const activeFilters = Number(!!filters.organization) + Number(!!filters.formation);
  const subtitle = `${dateLabel(start)} au ${dateLabel(end)}`;
  function rows(title, entries, renderValue, pending = false) { setDetail({ type: 'rows', title, rows: entries, renderValue, subtitle, pending }); }
  function metricRows(title, key) { rows(title, stats.contributions.filter(e => e.counts[view][key] > 0), e => numberLabel(e.counts[view][key])); }
  function missingRows(title, key) { rows(title, stats.contributions.filter(e => e.counts[view][key] > 0)); }
  function selectPeriod(next) { setPreset(next); if (next !== 'custom') setPeriod(periodPreset(next, today)); setAllPending(false); }
  const bases = finance ? ['HT', 'TTC'].filter(basis => finance.revenueEntries.some(e => e.taxBasis === basis)) : [];
  const revenueValue = bases.length ? bases.map(basis => <span key={basis}>{formatExpenseCents(finance.revenue[basis])} <small>{basis}</small></span>) : '0,00 €';
  return <div className="page-container activity-page statistics-dashboard"><p className="page-eyebrow">MON ACTIVITÉ</p>
    <div className="statistics-section-heading statistics-title"><h1>Mes statistiques</h1><ActivityHelp title="Mes statistiques"><p>Vos missions personnelles et confiées par un OF. Seules les réalisations confirmées par vous alimentent l’activité réalisée. Une session correspond à un groupe.</p><p>Touchez un chiffre pour retrouver les bilans qui le composent. Les frais et votre objectif restent privés, sans partage avec les OF, les autres formateurs ou les agendas.</p><p>Les totaux de personnes sont des participations : une même personne formée sur plusieurs missions n’est pas dédupliquée entre missions.</p></ActivityHelp></div>
    <div className="statistics-presets" aria-label="Période des statistiques">{[['month', 'Ce mois-ci'], ['previous', 'Mois précédent'], ['year', 'Cette année'], ['custom', 'Personnalisée']].map(([key, label]) => <button key={key} aria-pressed={preset === key} onClick={() => selectPeriod(key)}>{label}</button>)}</div>
    {preset === 'custom' ? <div className="activity-grid"><label>Début de période<input type="date" min="2000-01-01" max="2099-12-31" value={start} onChange={e => setPeriod(p => ({ ...p, start: e.target.value }))} /></label><label>Fin de période<input type="date" min="2000-01-01" max="2099-12-31" value={end} onChange={e => setPeriod(p => ({ ...p, end: e.target.value }))} /></label></div> : <p className="statistics-period">{subtitle}</p>}
    {!validPeriod && <p role="alert">Choisissez une période valide entre 2000 et 2099.</p>}
    <details className="statistics-filters"><summary>Filtrer {activeFilters > 0 ? `· ${activeFilters} actif(s)` : ''}</summary><div className="activity-grid">{[['organization', 'Donneur d’ordre / OF'], ['formation', 'Formation']].map(([key, label]) => <label key={key}>{label}<select value={filters[key]} onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value })); setAllPending(false); }}><option value="">Tous</option>{[...new Set((data || []).map(e => e[key]))].sort((a, b) => a.localeCompare(b, 'fr')).map(value => <option key={value}>{value}</option>)}</select></label>)}</div>{activeFilters > 0 && <button onClick={() => setFilters({ organization: '', formation: '' })}>Réinitialiser les filtres</button>}</details>
    {activeFilters > 0 && <p className="statistics-active-filters">{[filters.organization, filters.formation].filter(Boolean).join(' · ')}</p>}
    <div className="activity-tabs" aria-label="Vue des statistiques"><button aria-pressed={view === 'realized'} onClick={() => setView('realized')}>Activité réalisée</button><button aria-pressed={view === 'future'} onClick={() => setView('future')}>Activité à venir</button></div>
    {(error || calculationError) && <p role="alert">{error || calculationError} <button onClick={() => setAttempt(v => v + 1)}>Réessayer</button></p>}{!data && !error && <p role="status">Chargement…</p>}
    {a && !error && <>
      {view === 'realized' && <div className="activity-metrics statistics-financial">
        <Metric title="Chiffre d’affaires réalisé" value={revenueValue} help={<><p>Montants déclarés dans les bilans des formations réalisées ou partiellement réalisées. Pour une réalisation partielle, renseignez le montant correspondant à ce qui a été réalisé. Il ne s’agit ni des paiements reçus ni d’un suivi de factures.</p><p>Les montants HT et TTC restent séparés. Les tarifs prévus ne remplacent jamais un montant déclaré manquant. Un montant déclaré de zéro est valide.</p><p>Chaque montant est compté une seule fois à la date d’activité du bilan : première référence, ou première réalisation conservée d’un ancien bilan. Aucun prorata entre les jours ou les années.</p></>}
          onClick={() => rows('Chiffre d’affaires réalisé', finance.revenueEntries, e => `${formatExpenseCents(e.amount)} ${e.taxBasis}`)} warning={finance.missingRevenue.length ? `${finance.missingRevenue.length} montant(s) à renseigner` : ''} onWarning={() => rows('Montants à renseigner', finance.missingRevenue)} />
        <Metric title="Total des frais engagés" value={formatExpenseCents(finance.expenses)} help={<><p>Total des dépenses déclarées dans votre rubrique privée. Touchez le montant pour voir les catégories, puis les dépenses et leur mission.</p><p>Les frais n’ont pas de date propre : ils sont rattachés à la date d’activité ou à la première référence de la mission, y compris pour une mission non réalisée. Les missions dont cette date est future sont exclues ici.</p><p>Aucun frais déclaré ne signifie pas nécessairement zéro frais réel. Les anciennes dépenses sans montant restent visibles et sont exclues du total. Le kilométrage ne déclenche aucun calcul d’indemnité. Ces montants ne sont pas soustraits du CA pour calculer un bénéfice.</p></>}
          onClick={() => setDetail({ type: 'expenses', title: 'Répartition des frais engagés' })} warning={finance.missingExpenses.length + finance.unavailableExpenses.length ? 'Données de frais incomplètes' : ''} onWarning={() => setDetail({ type: 'expenses', title: 'Répartition des frais engagés' })} />
      </div>}
      <section className="statistics-panel statistics-activity"><div className="statistics-section-heading"><h2>{view === 'realized' ? 'Réalisé confirmé' : 'À venir confirmé'}</h2><ActivityHelp title="Règles de comptage"><p>Pour les bilans simplifiés, sessions, apprenants, jours et heures sont comptés une seule fois à la première date de référence. Pour un ancien bilan converti, la première date réalisée est conservée. Une session à cheval sur deux années reste rattachée à une seule période.</p><p>Les bilans historiques détaillés conservent leurs heures par date et leurs effectifs à la première réalisation de chaque groupe. Leur durée en jours reste inconnue : une date ne permet pas de déduire une journée entière.</p><p>L’activité à venir repose sur les dates des missions confirmées. Les options et propositions restent exclues. Une date passée sans confirmation ne compte pas comme réalisée.</p></ActivityHelp></div>
        <div className="activity-metrics statistics-counts">
          <Metric title="Missions" value={a.missions} help={<p>Une mission est comptée une seule fois dans la vue et la période sélectionnées.</p>} onClick={() => metricRows('Missions', 'missions')} />
          <Metric title="Sessions" value={a.sessions} help={<p>{view === 'realized' ? `${a.completed} terminées · ${a.partial} partiellement réalisées, dont ${a.ongoing} en cours avec dates futures.` : 'Une session correspond à un groupe. Les dates futures d’une mission confirmée sont prises en compte.'}</p>} onClick={() => metricRows('Sessions', 'sessions')} />
          {view === 'realized' ? <>
            <Metric title="Jours réellement animés" value={numberLabel(a.reportedDays)} help={<p>Durées en jours déclarées par le formateur, sans conversion depuis les heures. Les durées des présences partielles ne s’ajoutent pas au temps animé.</p>} onClick={() => metricRows('Jours réellement animés', 'reportedDays')} warning={a.missingReportedDays ? `${a.missingReportedDays} à renseigner` : ''} onWarning={() => missingRows('Durées en jours à renseigner', 'missingReportedDays')} />
            <Metric title="Heures réellement animées" value={numberLabel(a.hours)} help={<p>Durées en heures déclarées par le formateur. Ce sont les heures d’animation, et non la somme des heures suivies par chaque apprenant. Les durées partielles restent dans les bilans.</p>} onClick={() => metricRows('Heures réellement animées', 'hours')} warning={a.missingHours ? `${a.missingHours} à renseigner` : ''} onWarning={() => missingRows('Durées en heures à renseigner', 'missingHours')} />
            <Metric title="Apprenants entièrement formés" value={a.fullyTrainedLearners} help={<p>Personnes ayant suivi la formation intégralement. Les personnes partiellement formées sont comptées séparément.</p>} onClick={() => metricRows('Apprenants entièrement formés', 'fullyTrainedLearners')} />
            <Metric title="Apprenants partiellement formés" value={a.partialLearners} help={<p>Personnes déclarées dans les lignes de participation partielle du bilan, avec leur durée propre. Elles ne sont pas incluses dans les apprenants entièrement formés.</p>} onClick={() => metricRows('Apprenants partiellement formés', 'partialLearners')} />
            <Metric className="statistics-participants" title="Total des participants" value={a.learners} help={<><p>Apprenants entièrement et partiellement formés, sans doublon dans une mission. Une personne peut être comptée dans plusieurs missions.</p><p>{a.historicalLearners} participant(s) d’anciens bilans détaillés sans distinction complète/partielle. {a.learnersOutside} effectif(s) historique(s) affecté(s) à une autre période. Ces totaux ne constituent pas un export BPF.</p></>} onClick={() => metricRows('Total des participants', 'learners')} warning={a.missingLearners ? `${a.missingLearners} effectif(s) à renseigner` : ''} onWarning={() => missingRows('Effectifs à renseigner', 'missingLearners')} />
          </> : <>
            <Metric title="Dates prévues" value={a.days} help={<p>Dates des missions confirmées. Une date ne correspond pas nécessairement à une journée entière.</p>} onClick={() => metricRows('Dates prévues', 'days')} />
            <Metric title="Tarifs convenus totalisables" value={<><span>{formatExpenseCents(Math.round(a.fees.HT * 100))} <small>HT</small></span><span>{formatExpenseCents(Math.round(a.fees.TTC * 100))} <small>TTC</small></span></>} help={<><p>Tarifs totaux convenus des missions à venir, comptés à leur première date contractuelle. Ce n’est pas du chiffre d’affaires réalisé. Les tarifs par jour ou heure et les bases HT/TTC inconnues ne sont pas additionnés.</p><p>{a.feesOutside} montant(s) rattaché(s) à une autre période ou à une mission déjà commencée.</p></>} onClick={() => rows('Tarifs convenus à venir', stats.contributions.filter(e => e.counts.future.fees.HT || e.counts.future.fees.TTC), e => `${numberLabel(e.counts.future.fees.HT)} € HT · ${numberLabel(e.counts.future.fees.TTC)} € TTC`)} warning={a.missingFees ? `${a.missingFees} non totalisable(s)` : ''} onWarning={() => missingRows('Tarifs non totalisables', 'missingFees')} />
          </>}
        </div>{view === 'future' && stats.options > 0 && <small>{stats.options} proposition(s) ou option(s) exclue(s)</small>}
      </section>
      <section className="statistics-panel activity-pending"><div className="statistics-section-heading"><h2>À compléter · {stats.pending.length}</h2><ActivityHelp title="Bilans à compléter"><p>Bilans de la période avec une réalisation à confirmer, une durée, un effectif ou un montant manquant. La date affichée est la fin de la session. Les plus anciennes fins apparaissent en premier.</p><p>Touchez une ligne pour compléter le bilan. Un zéro déclaré est une donnée renseignée.</p></ActivityHelp></div>
        {stats.pending.length ? <><StatisticsRows rows={allPending ? stats.pending : stats.pending.slice(0, 5)} pending />{stats.pending.length > 5 && <button className="statistics-show-all" onClick={() => setAllPending(v => !v)}>{allPending ? 'Réduire la liste' : `Tout voir (${stats.pending.length})`}</button>}</> : <p className="statistics-empty">Aucun bilan à compléter sur cette période.</p>}
      </section>
      {view === 'realized' && <ActivityTrend entries={data} start={start} end={end} today={today} preset={preset} filters={filters} />}
      <MonthlyActivityGoal key={`${owner}:${today.slice(0, 7)}`} owner={owner} entries={data} today={today} />
      {stats.retained.length > 0 && <section className="statistics-panel activity-retained"><div className="statistics-section-heading"><h2>Bilans conservés · {stats.retained.length}</h2><ActivityHelp title="Bilans conservés"><p>Ces missions ne figurent plus dans vos affectations. Leurs bilans restent consultables et modifiables. Lorsque le donneur d’ordre n’est plus disponible, ils sont regroupés sous ce libellé dans le filtre.</p></ActivityHelp></div><details><summary>Consulter les bilans conservés</summary><StatisticsRows rows={stats.retained} /></details></section>}
      {detail && <StatisticsDetails key={detail.type} detail={detail} finance={finance} onClose={() => setDetail(null)} onCategory={category => setDetail({ type: 'expenses', category, title: category ? EXPENSE_CATEGORIES.find(([code]) => code === category)?.[1] : 'Répartition des frais engagés' })} />}
    </>}
  </div>;
}
export default function TrainerActivity() {
  const { trainerProfile, session } = useAuth();
  return <Dashboard key={`${session?.user?.id}:${trainerProfile?.id}`} owner={session?.user?.id} trainerId={trainerProfile?.id} />;
}
