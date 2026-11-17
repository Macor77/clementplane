import { activityKey, calculateActivity, reportKey } from './trainerActivity';
import { EXPENSE_CATEGORIES, parseExpenseCents } from './trainerExpenses';
import { missionHref } from './personalMissions';

const inPeriod = (date, start, end) => !!date && date >= start && date <= end;
const dateString = date => date.toISOString().slice(0, 10);
const utc = date => new Date(`${date}T12:00:00Z`);
const shiftDays = (date, days) => { const d = utc(date); d.setUTCDate(d.getUTCDate() + days); return dateString(d); };
const lastDay = (year, month) => dateString(new Date(Date.UTC(year, month, 0, 12)));
export const numberLabel = value => Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
export const dateLabel = value => value ? utc(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : 'Date non renseignée';

export function periodPreset(preset, today) {
  const [year, month] = today.split('-').map(Number);
  if (preset === 'year') return { start: `${year}-01-01`, end: `${year}-12-31` };
  if (preset === 'previous') {
    const start = dateString(new Date(Date.UTC(year, month - 2, 1, 12)));
    return { start, end: lastDay(Number(start.slice(0, 4)), Number(start.slice(5, 7))) };
  }
  return { start: `${today.slice(0, 7)}-01`, end: lastDay(year, month) };
}
export function comparisonPeriod(preset, start, end, today) {
  const currentEnd = end < today ? end : today;
  if (start > currentEnd) return null;
  if (preset === 'month' || preset === 'previous') {
    const previous = periodPreset('previous', start);
    const day = currentEnd.slice(8);
    return { start: previous.start, end: `${previous.start.slice(0, 7)}-${day}` < previous.end ? `${previous.start.slice(0, 7)}-${day}` : previous.end, currentEnd };
  }
  if (preset === 'year') {
    const year = Number(start.slice(0, 4)) - 1, month = Number(currentEnd.slice(5, 7));
    const candidate = `${year}${currentEnd.slice(4)}`;
    return { start: `${year}-01-01`, end: candidate < lastDay(year, month) ? candidate : lastDay(year, month), currentEnd };
  }
  const days = Math.round((utc(currentEnd) - utc(start)) / 86400000) + 1;
  return { start: shiftDays(start, -days), end: shiftDays(start, -1), currentEnd };
}

export function statisticsEntries(missions, reports, privateRows) {
  const reportMap = new Map(reports.map(r => [reportKey(r), r]));
  const privateMap = new Map(privateRows.map(r => [r.report_id, r]));
  const missionMap = new Map(missions.map(m => [activityKey(m), m]));
  for (const r of reports) if (!missionMap.has(reportKey(r))) missionMap.set(reportKey(r), {
    origin: r.personal_mission_id ? 'personal' : 'organization', mission_id: r.personal_mission_id || r.mission_id,
    mission_title: r.formation_title || r.sessions?.[0]?.formation || 'Bilan conservé', status: 'historical', dates: [], report_id: r.id,
  });
  return [...missionMap].map(([key, m]) => {
    const report = reportMap.get(key);
    const contract = (m.dates || []).map(d => d.date).filter(Boolean).sort();
    const historical = (report?.sessions || []).flatMap(s => s.days || []);
    const realizedDates = historical.filter(d => d.status === 'done').map(d => d.date).sort();
    const refs = [...(report?.reference_dates || [])].sort();
    const anchor = report?.report_mode === 'detailed' ? realizedDates[0] || refs[0] || contract[0] : report?.activity_date || refs[0] || contract[0];
    const dates = contract.length ? contract : [...refs, ...historical.map(d => d.date)].sort();
    return { key, mission: m, report, privateData: privateMap.get(report?.id), anchor,
      endDate: dates.at(-1), title: m.mission_title || m.formation || report?.formation_title || 'Mission de formation',
      organization: m.organization_name?.trim() || m.order_giver?.trim() || (m.report_id ? 'Donneur d’ordre non disponible' : 'Sans donneur d’ordre'),
      formation: m.formation?.trim() || report?.formation_title?.trim() || m.mission_title?.trim() || 'Formation non renseignée',
      href: m.report_id ? `/formateur/bilans/${m.report_id}` : `${missionHref(m)}#bilan`,
    };
  });
}
export function filterEntries(entries, filters = {}) {
  return entries.filter(e => (!filters.organization || e.organization === filters.organization) && (!filters.formation || e.formation === filters.formation));
}
function realizedReport(entry, today) {
  const r = entry.report;
  return !!r && entry.anchor <= today && (r.report_mode === 'simple' ? ['done', 'partial'].includes(r.summary?.status) : r.sessions?.some(s => s.days.some(d => d.status === 'done' && d.date <= today)));
}
function revenueCents(report) {
  if (!['HT', 'TTC'].includes(report?.tax_basis)) return null;
  try { return parseExpenseCents(report.declared_fee); } catch { return null; }
}
function addMoney(a, b) {
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) throw new Error('Total monétaire hors limite. Réduisez la période.');
  return sum;
}
export function buildStatistics(entries, start, end, today, filters = {}) {
  const scoped = filterEntries(entries, filters);
  const stats = calculateActivity(scoped.map(e => e.mission), scoped.flatMap(e => e.report ? [e.report] : []), start, end, today);
  const pendingKeys = new Set(stats.pending.map(activityKey));
  const finance = { revenue: { HT: 0, TTC: 0 }, revenueEntries: [], missingRevenue: [], expenses: 0, expenseItems: [], missingExpenses: [], unavailableExpenses: [], categories: [] };
  const contributions = scoped.map(entry => ({ ...entry, counts: calculateActivity([entry.mission], entry.report ? [entry.report] : [], start, end, today) }));
  const pending = [];
  for (const entry of contributions) {
    const r = entry.report, reasons = [];
    const qualifies = inPeriod(entry.anchor, start, end) && realizedReport(entry, today);
    if (qualifies) {
      const cents = revenueCents(r);
      if (cents == null) { finance.missingRevenue.push(entry); reasons.push(r.declared_fee == null ? 'Montant' : 'HT / TTC'); }
      else { finance.revenue[r.tax_basis] = addMoney(finance.revenue[r.tax_basis], cents); finance.revenueEntries.push({ ...entry, amount: cents, taxBasis: r.tax_basis }); }
    }
    // There are no expense dates yet. The mission anchor is explicit in the help.
    if (r && inPeriod(entry.anchor, start, end) && entry.anchor <= today) {
      if (!entry.privateData) finance.unavailableExpenses.push(entry);
      for (const item of entry.privateData?.expense_items || []) {
        const row = { ...item, entry };
        finance.expenseItems.push(row);
        if (item.amount_cents == null) { finance.missingExpenses.push(row); continue; }
        if (!Number.isSafeInteger(item.amount_cents) || item.amount_cents < 0) throw new Error('Montant de dépense invalide.');
        finance.expenses = addMoney(finance.expenses, item.amount_cents);
      }
    }
    if (pendingKeys.has(entry.key)) {
      if (!r || r.summary?.status === 'pending') reasons.unshift('Réalisation à confirmer');
      else {
        const a = entry.counts.realized;
        if (a.missingReportedDays) reasons.push('Durée en jours');
        if (a.missingHours) reasons.push('Durée en heures');
        if (a.missingLearners) reasons.push('Effectif');
        if (!reasons.length) reasons.push('Bilan incomplet');
      }
    }
    if (reasons.length) pending.push({ ...entry, reasons });
  }
  finance.categories = EXPENSE_CATEGORIES.map(([code, label]) => ({ code, label,
    amount: finance.expenseItems.filter(row => row.category === code).reduce((sum, row) => addMoney(sum, row.amount_cents ?? 0), 0),
    count: finance.expenseItems.filter(row => row.category === code).length,
  })).filter(c => c.count).sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label, 'fr'));
  return { ...stats, finance, contributions, pending: pending.sort((a, b) => (a.endDate || '').localeCompare(b.endDate || '')), retained: contributions.filter(e => stats.retained.some(m => activityKey(m) === e.key)) };
}

export function trendBuckets(entries, start, end, today, filters = {}) {
  const scoped = filterEntries(entries, filters);
  const months = (Number(end.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(end.slice(5, 7)) - Number(start.slice(5, 7)) + 1;
  const yearly = months > 24;
  const buckets = [];
  if (months <= 2) {
    for (let from = start; from <= end; from = shiftDays(from, 7)) {
      const stop = shiftDays(from, 6), to = stop < end ? stop : end;
      const s = buildStatistics(scoped, from, to, today);
      const sessions = scoped.reduce((sum, e) => sum + (e.report?.report_mode === 'detailed'
        ? (e.report.sessions || []).filter(group => inPeriod(group.days.filter(d => d.status === 'done' && d.date <= today).map(d => d.date).sort()[0], from, to)).length
        : Number(realizedReport(e, today) && inPeriod(e.anchor, from, to))), 0);
      buckets.push({ start: from, end: to, label: `${from.slice(8)}/${from.slice(5, 7)}–${to.slice(8)}/${to.slice(5, 7)}`, revenue: s.finance.revenue, sessions });
    }
    return buckets;
  }
  for (let cursor = yearly ? `${start.slice(0, 4)}-01-01` : `${start.slice(0, 7)}-01`; cursor <= end;) {
    const year = Number(cursor.slice(0, 4)), month = Number(cursor.slice(5, 7));
    const stop = yearly ? `${year}-12-31` : lastDay(year, month);
    const from = cursor < start ? start : cursor, to = stop > end ? end : stop;
    const s = buildStatistics(scoped, from, to, today);
    // A historical group spanning months is charted once at its first realization.
    let sessions = 0;
    for (const e of scoped) {
      if (e.report?.report_mode === 'detailed') {
        for (const group of e.report.sessions || []) {
          const first = group.days.filter(d => d.status === 'done' && d.date <= today).map(d => d.date).sort()[0];
          if (inPeriod(first, from, to)) sessions++;
        }
      } else if (realizedReport(e, today) && inPeriod(e.anchor, from, to)) sessions++;
    }
    buckets.push({ start: from, end: to, label: yearly ? String(year) : utc(cursor).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' }), revenue: s.finance.revenue, sessions });
    cursor = yearly ? `${year + 1}-01-01` : dateString(new Date(Date.UTC(year, month, 1, 12)));
  }
  return buckets;
}

export const GOAL_METRICS = [['sessions', 'Sessions réalisées'], ['days', 'Jours animés'], ['revenue_ht', 'Chiffre d’affaires HT'], ['revenue_ttc', 'Chiffre d’affaires TTC']];
export function validateGoal(metric, target) {
  if (!GOAL_METRICS.some(([code]) => code === metric)) throw new Error('Choisissez un indicateur.');
  const cents = parseExpenseCents(target);
  if (cents == null || cents <= 0 || (metric === 'sessions' && cents % 100 !== 0)) throw new Error('Choisissez un objectif positif, entier pour les sessions.');
  return cents / 100;
}
export function goalProgress(entries, goal, today) {
  const period = periodPreset('month', goal.month);
  const stats = buildStatistics(entries, period.start, period.end, today);
  const value = goal.metric === 'sessions' ? stats.realized.sessions : goal.metric === 'days' ? stats.realized.reportedDays : stats.finance.revenue[goal.metric === 'revenue_ht' ? 'HT' : 'TTC'] / 100;
  const missing = goal.metric === 'days' ? stats.realized.missingReportedDays : goal.metric.startsWith('revenue') ? stats.finance.missingRevenue.length : 0;
  return { value, percent: Math.round(value / Number(goal.target) * 10000) / 100, missing };
}
