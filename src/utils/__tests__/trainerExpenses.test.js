import { describe, it, expect } from 'vitest';
import { EXPENSE_CATEGORIES, parseExpenseCents, expenseDraft, expenseTotal, formatExpenseCents, newExpense, validateExpenses } from '../trainerExpenses';
import { activityDraft, initialActivity, validateActivity } from '../trainerActivity';
const row = (amount = '0.10', values = {}) => ({ ...newExpense(), category: 'meals', amount, ...values });
describe('private expenses', () => {
  it('offers eleven distinct categories and repeated rows of one category', () => {
    expect(new Set(EXPENSE_CATEGORIES.map(([code]) => code)).size).toBe(11);
    expect(validateExpenses([row(), row()])).toHaveLength(2);
  });
  it.each(['0', '0.00', '0,00'])('accepts an explicit zero: %s', amount => expect(parseExpenseCents(amount)).toBe(0));
  it.each(['-0.001', '-1', 'abc', 'NaN', 'Infinity', '1e2', '1.234', '1,234', '1.', '100000000', '1 000'])('rejects invalid amount %s', amount => expect(() => parseExpenseCents(amount)).toThrow());
  it('uses exact cents for repeated decimals and accepts French decimal separators', () => {
    expect(expenseTotal([row('0.1'), row('0,20')])).toBe(30);
    expect(formatExpenseCents(expenseTotal(Array.from({ length: 1000 }, () => row())))).toBe('100,00 €');
    expect(parseExpenseCents('99999999.99')).toBe(9999999999);
  });
  it('ignores wholly empty rows but rejects a category, text or amount without the other required fields', () => {
    expect(validateExpenses([newExpense(), row('0')])).toHaveLength(1);
    for (const partial of [{ category: 'meals' }, { amount: '1' }, { details: 'ticket' }]) expect(() => validateExpenses([{ ...newExpense(), ...partial }])).toThrow();
    expect(expenseTotal([row('bad'), row('2.10'), newExpense()])).toBe(210);
  });
  it('requires details for other expenses and rejects unknown categories, duplicate ids, oversized totals/text', () => {
    const first = row();
    for (const rows of [[row('1', { category: 'other', details: ' \n ' })], [row('1', { category: 'unknown' })], [first, first], [row('99999999.99'), row('0.01')], [row('1', { details: 'x'.repeat(5001) })]]) expect(() => validateExpenses(rows)).toThrow();
    expect(validateExpenses([row('1', { category: 'other', details: '  Texte original\n' })])[0].details).toBe('  Texte original\n');
  });
  it('reloads exact decimals, edits and deletes without an extra migration row', () => {
    const saved = validateExpenses([row('17,42'), row('0.01')]);
    const draft = expenseDraft(saved);
    expect(draft.map(r => r.amount)).toEqual(['17.42', '0.01']);
    expect(validateExpenses(draft)).toEqual(saved);
    draft[0].amount = '18.40';
    expect(validateExpenses(draft.slice(0, 1))[0].amount_cents).toBe(1840);
    expect(validateExpenses([])).toEqual([]);
  });
  it('preserves a legacy unknown amount during unrelated edits without fabricating zero', () => {
    const original = { id: newExpense().id, category: 'other', amount_cents: null, details: 'Texte ancien' };
    const report = initialActivity({ dates: [{ date: '2026-01-01' }] }, 'personal');
    const draft = activityDraft(report, { expense_items: [original], legacy_expenses: null, legacy_expense_details: 'Texte ancien' });
    draft.observations = 'Nouvelle observation';
    const payload = validateActivity(draft, '2026-11-15');
    expect(payload.expense_items).toEqual([original]);
    expect(payload).not.toHaveProperty('legacy_expense_details');
    expect(payload).not.toHaveProperty('expenses');
    draft.expense_items[0].amount = '15.32';
    expect(validateActivity(draft).expense_items[0].amount_cents).toBe(1532);
  });
});
