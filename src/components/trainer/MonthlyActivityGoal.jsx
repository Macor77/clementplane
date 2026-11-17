import { useEffect, useRef, useState } from 'react';
import ActivityHelp from './ActivityHelp';
import { deleteMonthlyGoal, getMonthlyGoal, saveMonthlyGoal } from '../../services/trainerStatisticsService';
import { GOAL_METRICS, goalProgress, numberLabel } from '../../utils/trainerStatistics';
import { formatExpenseCents } from '../../utils/trainerExpenses';

export default function MonthlyActivityGoal({ owner, entries, today }) {
  const month = `${today.slice(0, 7)}-01`;
  const [goal, setGoal] = useState(null), [metric, setMetric] = useState('sessions'), [target, setTarget] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let active = true; setLoading(true); setLoaded(false); setError('');
    getMonthlyGoal(owner, month).then(data => { if (active) { setGoal(data); setMetric(data?.metric || 'sessions'); setTarget(data ? String(data.target) : ''); setLoading(false); setLoaded(true); } }).catch(() => { if (active) { setLoading(false); setError('Objectif indisponible. Vos statistiques restent accessibles.'); } });
    return () => { active = false; };
  }, [owner, month, attempt]);
  const progress = goal && goalProgress(entries, goal, today);
  const dirty = metric !== (goal?.metric || 'sessions') || target !== (goal ? String(goal.target) : '');
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const saved = await saveMonthlyGoal(owner, { month, metric, target });
      if (alive.current) { setGoal(saved); setTarget(String(saved.target)); setMessage('Objectif enregistré.'); }
    } catch (e) { if (alive.current) setError(e.message?.startsWith('Choisissez') || e.message?.startsWith('Saisissez') ? e.message : 'Enregistrement impossible. Votre saisie est conservée.'); }
    finally { if (alive.current) setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError(''); setMessage('');
    try { await deleteMonthlyGoal(owner, month); if (alive.current) { setGoal(null); setMetric('sessions'); setTarget(''); setMessage('Objectif supprimé.'); } }
    catch { if (alive.current) setError('Suppression impossible. Réessayez.'); }
    finally { if (alive.current) setBusy(false); }
  }
  const money = goal?.metric.startsWith('revenue');
  const label = value => money ? formatExpenseCents(Math.round(value * 100)) : numberLabel(value);
  return <section className="statistics-panel statistics-goal"><div className="statistics-section-heading"><h2>Mon objectif du mois</h2><ActivityHelp title="Objectif personnel"><p>Un objectif facultatif et privé pour le mois en cours. Il porte sur toutes vos missions, même lorsque des filtres ou une autre période sont sélectionnés au-dessus.</p><p>Choisissez les sessions réalisées, les jours animés ou le chiffre d’affaires HT ou TTC. Les montants manquants restent exclus. Vous pouvez modifier ou supprimer cet objectif à tout moment.</p></ActivityHelp></div>
    <small>{new Date(`${month}T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })} · Toutes mes missions</small>
    {loading ? <p role="status">Chargement de l’objectif…</p> : <>
      {progress && <div className="statistics-goal-progress"><strong>{label(progress.value)} / {label(Number(goal.target))}</strong><span>{GOAL_METRICS.find(([code]) => code === goal.metric)?.[1]} · {numberLabel(progress.percent)} %</span>
        <progress max="100" value={Math.min(progress.percent, 100)} aria-label="Progression de mon objectif" />
        {progress.percent >= 100 && <span className="statistics-success">Objectif atteint !</span>}{progress.missing > 0 && <small>{progress.missing} donnée(s) à compléter</small>}
      </div>}
      {loaded && <details><summary>{goal ? 'Modifier mon objectif' : 'Définir un objectif'}</summary><form onSubmit={save}>
        <fieldset disabled={busy}><label>Indicateur<select value={metric} onChange={e => { setMetric(e.target.value); setMessage(''); }}>{GOAL_METRICS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
          <label>Objectif {metric.startsWith('revenue') ? '(€)' : metric === 'days' ? '(jours)' : '(sessions)'}<input inputMode={metric === 'sessions' ? 'numeric' : 'decimal'} value={target} onChange={e => { setTarget(e.target.value); setMessage(''); }} required /></label>
          {dirty && <small>Modifications non enregistrées</small>}<div className="statistics-goal-actions"><button type="submit">{busy ? 'Enregistrement…' : 'Enregistrer l’objectif'}</button>{goal && <button type="button" onClick={remove}>Supprimer l’objectif</button>}</div>
        </fieldset></form></details>}
    </>}{error && <p role="alert">{error} {!loaded && <button onClick={() => setAttempt(n => n + 1)} disabled={busy}>Réessayer</button>}</p>}{message && <p role="status">{message}</p>}
  </section>;
}
