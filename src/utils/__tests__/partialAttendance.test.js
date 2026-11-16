import { describe, it, expect } from 'vitest';
import { newPartialAttendance, validatePartialAttendance, partialLearnerTotal } from '../partialAttendance';
import { initialActivity, validateActivity, activityDraft, calculateActivity } from '../trainerActivity';
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const row = (n = 1, extra = {}) => ({ id: uuid(n), learner_count: 1, actual_days: null, actual_hours: 1, ...extra });
const summary = { status: 'done', learner_count: 10, actual_days: 1, actual_hours: 7 };
describe('Complete and partial attendance are separate in the form', () => {
  it('keeps repeated durations and independent fractional days', () => {
    const rows = validatePartialAttendance([row(), row(2, { learner_count: '3', actual_days: '0,5', actual_hours: '3' }), row(3)], summary);
    expect(rows[1]).toMatchObject({ learner_count: 3, actual_days: 0.5, actual_hours: 3 });
    expect(partialLearnerTotal(rows)).toBe(5);
  });
  it('ignores entirely blank rows, allows days alone and does not invent hours', () => {
    expect(validatePartialAttendance([newPartialAttendance(), row(2, { actual_hours: null, actual_days: '0.25' })], summary)).toEqual([row(2, { actual_hours: null, actual_days: 0.25 })]);
  });
  it.each(['0', '-1', '1.5', 'abc', '100001'])('rejects invalid count %s', learner_count => {
    expect(() => validatePartialAttendance([row(1, { learner_count })], summary)).toThrow(/Apprenants partiellement/);
  });
  it.each(['0', '-1', 'abc', '1.001', '240001'])('rejects invalid duration %s', actual_hours => {
    expect(() => validatePartialAttendance([row(1, { actual_hours })], summary)).toThrow(/Apprenants partiellement/);
  });
  it('requires count and one duration, refuses duplicates and malformed rows', () => {
    for (const rows of [[row(1, { learner_count: '' })], [row(1, { actual_hours: null })], [row(), row()], [null], {}]) {
      expect(() => validatePartialAttendance(rows, summary)).toThrow(/Apprenants partiellement/);
    }
  });
  it('requires realized status and a known complete count, allowing zero and more partial than complete', () => {
    for (const s of [undefined, { ...summary, status: 'pending' }, { ...summary, learner_count: null }]) expect(() => validatePartialAttendance([row()], s)).toThrow(/Apprenants partiellement/);
    expect(validatePartialAttendance([row(1, { learner_count: 8 }), row(2, { learner_count: 3 })], summary)).toHaveLength(2);
    expect(validatePartialAttendance([row(1, { learner_count: 10 })], { ...summary, learner_count: 0 })).toHaveLength(1);
    expect(() => validatePartialAttendance([row(1, { learner_count: 100000 })], summary)).toThrow(/100 000/);
    expect(validatePartialAttendance([], { ...summary, learner_count: 0 })).toEqual([]);
  });
  it('checks known global durations without converting days into hours', () => {
    expect(() => validatePartialAttendance([row(1, { actual_hours: 8 })], summary)).toThrow(/dépasse/);
    expect(() => validatePartialAttendance([row(1, { actual_days: 2 })], summary)).toThrow(/dépasse/);
    expect(validatePartialAttendance([row(1, { actual_days: 0.5, actual_hours: 3 })], { ...summary, actual_hours: null })).toHaveLength(1);
  });
  it('preserves rows and private data through reload and unrelated edits', () => {
    const report = { ...initialActivity({ dates: [{ date: '2026-01-01' }] }, 'personal'), summary, partial_attendance: [row()], report_mode: 'simple' };
    const draft = activityDraft(report, { expense_items: [], kilometers: 42, difficulties: 'Privé' });
    const data = validateActivity({ ...draft, observations: 'Correction' }, '2026-11-16');
    expect(draft.summary.learner_count).toBe(9); expect(data.summary.learner_count).toBe(10); expect(data.partial_attendance).toEqual([row()]); expect(data.kilometers).toBe(42); expect(data.difficulties).toBe('Privé');
    expect(activityDraft({ ...report, partial_attendance: undefined }).partial_attendance).toEqual([]);
  });
  it('separates counts without adding participants or trainer durations twice', () => {
    const report = { id: 'r', report_mode: 'simple', summary, partial_attendance: [row(), row(2, { learner_count: 3, actual_hours: 3 })], reference_dates: ['2026-01-01'], activity_date: '2026-01-01', sessions: [] };
    const result = calculateActivity([], [report], '2026-01-01', '2026-12-31', '2026-11-16').realized;
    expect(result).toMatchObject({ sessions: 1, learners: 10, fullyTrainedLearners: 6, partialLearners: 4, hours: 7, reportedDays: 1 });
  });
});

describe('inclusive storage stays backward compatible', () => {
  const saved = (total = 4, rows = [row()]) => ({ ...initialActivity({ dates: [{ date: '2026-01-01' }] }, 'personal'), report_mode: 'simple', sessions: [], summary: { status: 'done', learner_count: total, actual_hours: 3.5, actual_days: 0.5 }, partial_attendance: rows });
  it('loads three complete plus one partial from an old total of four without mutating the report', () => {
    const report = saved();
    const draft = activityDraft(report);
    expect(draft.summary.learner_count).toBe(3);
    expect(report.summary.learner_count).toBe(4);
    const data = validateActivity(draft, '2026-11-16');
    expect(data.summary.learner_count).toBe(4);
    expect(data.partial_attendance).toEqual(report.partial_attendance);
    expect(activityDraft({ ...report, ...data }).summary.learner_count).toBe(3);
  });
  it('keeps complete count independent when adding or removing partial rows, including all-partial missions', () => {
    const draft = activityDraft(saved());
    const changed = { ...draft, partial_attendance: [row(), row(2, { learner_count: 3 })] };
    expect(validateActivity(changed, '2026-11-16').summary.learner_count).toBe(7);
    expect(validateActivity({ ...changed, summary: { ...changed.summary, learner_count: 0 } }, '2026-11-16').summary.learner_count).toBe(4);
    expect(validateActivity({ ...changed, partial_attendance: [] }, '2026-11-16').summary.learner_count).toBe(3);
  });
  it('keeps unknown complete counts and partial hours distinct from zero', () => {
    expect(activityDraft(saved(null, [])).summary.learner_count).toBeNull();
    const data = validateActivity(activityDraft(saved(1, [row(1, { actual_hours: null, actual_days: 0.25 })])), '2026-11-16');
    expect(data.partial_attendance[0].actual_hours).toBeNull();
    expect(data.summary.learner_count).toBe(1);
  });
  it('anchors both counts in the same period, keeps trainer hours and unknown historical attendance distinct', () => {
    const report = { ...saved(), id: 'r', activity_date: '2026-01-01' };
    expect(calculateActivity([], [report], '2026-01-01', '2026-12-31', '2026-11-16').realized).toMatchObject({ learners: 4, fullyTrainedLearners: 3, partialLearners: 1, hours: 3.5, historicalLearners: 0 });
    expect(calculateActivity([], [report], '2027-01-01', '2027-12-31', '2026-11-16').realized).toMatchObject({ learners: 0, fullyTrainedLearners: 0, partialLearners: 0 });
    const legacy = { ...report, id: 'old', report_mode: 'detailed', summary: null, partial_attendance: [], sessions: [{ id: 'g', formation: 'Fictive', learner_count: 4, days: [{ date: '2026-01-01', status: 'done', actual_hours: 3.5 }] }] };
    expect(calculateActivity([], [legacy], '2026-01-01', '2026-12-31', '2026-11-16').realized).toMatchObject({ learners: 4, fullyTrainedLearners: 0, partialLearners: 0, historicalLearners: 4 });
  });
});

it('keeps historical single-group counts unclassified on unrelated edits, until explicitly split', () => {
  const report = { report_mode: 'detailed', reference_dates: ['2026-01-01'], partial_attendance: [], sessions: [{ id: uuid(90), formation: 'Fictive', group_label: '', learner_count: 4, expected_learners: null, days: [{ date: '2026-01-01', status: 'done', actual_hours: 3.5, planned_hours: null }] }] };
  const draft = activityDraft(report, { expense_items: [], kilometers: 42 });
  expect(draft.summary.learner_count).toBeNull(); expect(draft.legacy_learner_count).toBe(4);
  const unrelated = validateActivity({ ...draft, observations: 'Corrigée' }, '2026-11-16');
  expect(unrelated).not.toHaveProperty('summary'); expect(unrelated.sessions).toEqual(report.sessions);
  expect(unrelated.kilometers).toBe(42);
  expect(() => validateActivity({ ...draft, summary: { ...draft.summary, actual_days: 0.5 } }, '2026-11-16')).toThrow(/bilan historique/);
  const split = validateActivity({ ...draft, summary: { ...draft.summary, learner_count: 3, actual_days: 0.5 }, partial_attendance: [row()] }, '2026-11-16');
  expect(split.summary.learner_count).toBe(4); expect(split).not.toHaveProperty('sessions');
});

it.each(['not_done', 'pending'])('allows correcting a historical realized report to %s without a disabled learner count', status => {
  const report = { report_mode: 'detailed', reference_dates: ['2026-01-01'], sessions: [{ id: uuid(91), formation: 'Fictive', learner_count: 4, days: [{ date: '2026-01-01', status: 'done', actual_hours: 3.5 }] }] };
  const draft = activityDraft(report, { expense_items: [], kilometers: 42 });
  const result = validateActivity({ ...draft, summary: { status, learner_count: null, actual_days: null, actual_hours: null } }, '2026-11-16');
  expect(result.summary).toEqual({ status, learner_count: null, actual_days: null, actual_hours: null });
  expect(result.partial_attendance).toEqual([]); expect(result.kilometers).toBe(42);
  expect(result).not.toHaveProperty('sessions');
  expect(report.sessions[0].learner_count).toBe(4);
});
