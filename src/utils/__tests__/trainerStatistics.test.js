import { describe, expect, it } from 'vitest';
import { buildStatistics, statisticsEntries, periodPreset, comparisonPeriod, trendBuckets, goalProgress, validateGoal } from '../trainerStatistics';
const today = '2026-11-17';
const mission = (id, dates = ['2026-11-01']) => ({ origin: 'personal', mission_id: id, mission_title: 'SST', order_giver: 'OF Démo', status: 'affecte', dates: dates.map(date => ({ date })), fee: 900, fee_unit: 'mission' });
const report = (id, fee = '100.10', status = 'done') => ({ id: `r${id}`, personal_mission_id: id, report_mode: 'simple', sessions: [], reference_dates: ['2026-11-01'], activity_date: '2026-11-01', summary: { status, learner_count: 4, actual_days: 0.5, actual_hours: 3.5 }, partial_attendance: [{ learner_count: 1, actual_hours: 1 }], declared_fee: fee, tax_basis: 'HT' });
const build = (missions, reports, expenses = [], start = '2026-11-01', end = '2026-11-30', filters = {}) => buildStatistics(statisticsEntries(missions, reports, expenses), start, end, today, filters);
describe('trainer statistics money and scope', () => {
  it('counts only declared realized revenue, separates tax bases and retains zero and missing values', () => {
    const reports = [report(1), report(2, '0.20'), { ...report(3, 50), tax_basis: 'TTC' }, report(4, 0), report(5, null), report(6, 999, 'pending'), report(7, 800, 'not_done'), report(8, 10, 'partial'), { ...report(9, 20), tax_basis: null }];
    const s = build(reports.map((_, i) => mission(i + 1)), reports);
    expect(s.finance.revenue).toEqual({ HT: 11030, TTC: 5000 });
    expect(s.finance.missingRevenue.map(e => e.report.id)).toEqual(['r5', 'r9']);
    expect(s.realized.fullyTrainedLearners).toBe(21); expect(s.realized.partialLearners).toBe(7);
  });
  it('totals repeated categories exactly, excludes migrated archives and exposes unknown historical amounts', () => {
    const s = build([mission(1)], [report(1)], [{ report_id: 'r1', legacy_expenses: 999, expense_items: [{ id: 'a', category: 'meals', amount_cents: 10 }, { id: 'b', category: 'meals', amount_cents: 20 }, { id: 'c', category: 'other', amount_cents: null, details: 'Ancien texte' }] }]);
    expect(s.finance.expenses).toBe(30); expect(s.finance.categories[0]).toMatchObject({ code: 'meals', amount: 30 });
    expect(s.finance.expenseItems).toHaveLength(3); expect(s.finance.missingExpenses).toHaveLength(1);
  });
  it('retains cancelled-mission costs, retained reports, and applies OF/training filters consistently', () => {
    const missions = [mission(1), { ...mission(2), mission_title: 'Incendie', order_giver: 'Autre OF' }];
    const reports = [report(1, 100, 'not_done'), report(2), { ...report(3), formation_title: 'Historique' }];
    const expenses = [{ report_id: 'r1', expense_items: [{ category: 'fuel', amount_cents: 1200 }] }];
    expect(build(missions, reports, expenses).finance.expenses).toBe(1200);
    expect(build(missions, reports, expenses).retained).toHaveLength(1);
    const scoped = build(missions, reports, expenses, undefined, undefined, { organization: 'Autre OF', formation: 'Incendie' });
    expect(scoped.realized.sessions).toBe(1); expect(scoped.finance.expenses).toBe(0); expect(scoped.finance.revenue.HT).toBe(10010);
  });
  it('counts a cross-period historical amount once and never uses planned fees as revenue', () => {
    const r = { ...report(1), report_mode: 'detailed', summary: null, sessions: [{ id: 's', formation: 'SST', learner_count: 3, days: [{ date: '2026-10-31', status: 'done', actual_hours: 2 }, { date: '2026-11-01', status: 'done', actual_hours: 3 }] }] };
    const s = build([mission(1)], [r]);
    expect(s.finance.revenue.HT).toBe(0); expect(s.realized.hours).toBe(3);
    expect(build([mission(1)], [report(1, null)]).finance.revenue.HT).toBe(0);
  });
  it('adds missing financial information to pending rows with the last session date and no duplicate', () => {
    const r = report(1, null); r.summary.actual_hours = null;
    const s = build([mission(1, ['2026-11-01', '2026-11-03'])], [r]);
    expect(s.pending).toHaveLength(1); expect(s.pending[0].endDate).toBe('2026-11-03');
    expect(s.pending[0].reasons).toEqual(expect.arrayContaining(['Durée en heures', 'Montant']));
  });
});
describe('calendar comparisons and personal goal', () => {
  it('handles previous month, leap year and equal elapsed comparisons', () => {
    expect(periodPreset('previous', '2026-01-17')).toEqual({ start: '2025-12-01', end: '2025-12-31' });
    expect(comparisonPeriod('month', '2026-03-01', '2026-03-31', '2026-03-31')).toEqual({ start: '2026-02-01', end: '2026-02-28', currentEnd: '2026-03-31' });
    expect(comparisonPeriod('year', '2024-01-01', '2024-12-31', '2024-02-29')).toEqual({ start: '2023-01-01', end: '2023-02-28', currentEnd: '2024-02-29' });
    expect(comparisonPeriod('custom', '2026-11-01', '2026-11-10', today)).toEqual({ start: '2026-10-22', end: '2026-10-31', currentEnd: '2026-11-10' });
  });
  it('keeps chart endpoints and empty buckets without making future revenue', () => {
    const entries = statisticsEntries([mission(1)], [report(1)], []);
    const bars = trendBuckets(entries, '2026-10-01', '2026-12-31', today);
    expect(bars.map(b => b.revenue.HT)).toEqual([0, 10010, 0]);
    expect(bars.map(b => b.sessions)).toEqual([0, 1, 0]);
  });
  it('validates integer session goals, decimal day/money goals and zero; preserves exceeded progress', () => {
    expect(() => validateGoal('sessions', '2.5')).toThrow(); expect(() => validateGoal('days', 0)).toThrow(); expect(() => validateGoal('revenue_ht', '1e5')).toThrow();
    expect(validateGoal('days', '2,5')).toBe(2.5);
    const entries = statisticsEntries([mission(1)], [report(1)], []);
    expect(goalProgress(entries, { month: '2026-11-01', metric: 'revenue_ht', target: 50 }, today)).toMatchObject({ value: 100.1, percent: 200.2 });
  });
});
