import { useMemo, useState } from 'react';
import ActivityHelp from './ActivityHelp';
import { buildStatistics, comparisonPeriod, dateLabel, numberLabel, trendBuckets } from '../../utils/trainerStatistics';
import { formatExpenseCents } from '../../utils/trainerExpenses';

export default function ActivityTrend({ entries, start, end, today, preset, filters }) {
  const [metric, setMetric] = useState('HT');
  const bars = useMemo(() => trendBuckets(entries, start, end, today, filters), [entries, start, end, today, filters]);
  const comparison = comparisonPeriod(preset, start, end, today);
  const previous = comparison && buildStatistics(entries, comparison.start, comparison.end, today, filters);
  const current = comparison && buildStatistics(entries, start, comparison.currentEnd, today, filters);
  const read = stats => metric === 'sessions' ? stats.realized.sessions : stats.finance.revenue[metric];
  const previousValue = previous ? read(previous) : 0, value = current ? read(current) : 0;
  const label = value => metric === 'sessions' ? `${numberLabel(value)} session(s)` : `${formatExpenseCents(value)} ${metric}`;
  const chartValue = bar => metric === 'sessions' ? bar.sessions : bar.revenue[metric];
  const max = Math.max(1, ...bars.map(chartValue));
  const incomplete = metric !== 'sessions' && (current?.finance.missingRevenue.length || previous?.finance.missingRevenue.length);
  return <section className="statistics-panel statistics-trend"><div className="statistics-section-heading"><h2>Évolution de mon activité</h2><ActivityHelp title="Évolution et comparaison"><p>Le graphique suit la période et les filtres sélectionnés. Le CA correspond aux montants déclarés des formations réalisées, avec HT et TTC séparés.</p><p>Le mois et l’année en cours sont comparés aux mêmes jours écoulés de la période précédente, dans la limite des jours disponibles. Une période personnalisée est comparée à la période précédente de même durée écoulée. Si la période précédente vaut zéro, aucun pourcentage n’est calculé.</p><p>Les sessions du graphique sont rattachées à leur première réalisation. Un ancien groupe réparti sur plusieurs mois n’apparaît donc qu’une fois dans le graphique ; son activité peut néanmoins apparaître dans plusieurs périodes du tableau de bord.</p></ActivityHelp></div>
    <label className="statistics-chart-selector">Indicateur du graphique<select value={metric} onChange={e => setMetric(e.target.value)}><option value="HT">Chiffre d’affaires HT</option><option value="TTC">Chiffre d’affaires TTC</option><option value="sessions">Sessions réalisées</option></select></label>
    {comparison && <div className="statistics-comparison"><strong>{label(value)}</strong><span>{previousValue > 0 ? `${value >= previousValue ? '+' : '−'}${numberLabel(Math.abs((value - previousValue) / previousValue * 100))} %` : 'Sans base de comparaison'}</span><small>Précédent : {label(previousValue)} · {dateLabel(comparison.start)} au {dateLabel(comparison.end)}</small>{incomplete > 0 && <small className="statistics-warning">Comparaison partielle : montants manquants</small>}</div>}
    <ul className="statistics-chart" aria-label="Évolution par période">{bars.map(bar => <li key={bar.start}><span>{bar.label}</span><span className="statistics-bar-track" aria-hidden="true"><span style={{ width: `${chartValue(bar) / max * 100}%` }} /></span><b>{label(chartValue(bar))}</b></li>)}</ul>
  </section>;
}
