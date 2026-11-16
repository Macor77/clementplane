import { describe, it, expect } from 'vitest';
import { newPartialAttendance, validatePartialAttendance, partialLearnerTotal } from '../partialAttendance';
import { initialActivity, validateActivity, activityDraft, calculateActivity } from '../trainerActivity';
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const row = (n = 1, extra = {}) => ({ id: uuid(n), learner_count: 1, actual_days: null, actual_hours: 1, ...extra });
const summary = { status: 'done', learner_count: 10, actual_days: 1, actual_hours: 7 };
describe('Partial attendance is a subset of the total', () => {
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
  it('requires realized status, known total and a subset not exceeding it', () => {
    for (const s of [undefined, { ...summary, status: 'pending' }, { ...summary, learner_count: null }, { ...summary, learner_count: 0 }]) expect(() => validatePartialAttendance([row()], s)).toThrow(/Apprenants partiellement/);
    expect(() => validatePartialAttendance([row(1, { learner_count: 8 }), row(2, { learner_count: 3 })], summary)).toThrow(/dépasser/);
    expect(validatePartialAttendance([row(1, { learner_count: 10 })], summary)).toHaveLength(1);
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
    expect(data.partial_attendance).toEqual([row()]); expect(data.kilometers).toBe(42); expect(data.difficulties).toBe('Privé');
    expect(activityDraft({ ...report, partial_attendance: undefined }).partial_attendance).toEqual([]);
  });
  it('never adds subset counts or durations to statistics', () => {
    const report = { id: 'r', report_mode: 'simple', summary, partial_attendance: [row(), row(2, { learner_count: 3, actual_hours: 3 })], reference_dates: ['2026-01-01'], activity_date: '2026-01-01', sessions: [] };
    const result = calculateActivity([], [report], '2026-01-01', '2026-12-31', '2026-11-16').realized;
    expect(result).toMatchObject({ sessions: 1, learners: 10, hours: 7, reportedDays: 1 });
  });
});
