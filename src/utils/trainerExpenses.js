export const EXPENSE_CATEGORIES = [
  ['meals', 'Repas'], ['accommodation', 'Hébergement'], ['fuel', 'Carburant'],
  ['tolls', 'Péages'], ['parking', 'Stationnement'],
  ['public_transport', 'Transports en commun (train, métro, bus, avion)'],
  ['taxi', 'Taxi / VTC'], ['vehicle_rental', 'Location de véhicule'],
  ['teaching_material', 'Matériel pédagogique'], ['material_transport', 'Transport de matériel'],
  ['other', 'Autres frais'],
];
export const MAX_EXPENSE_CENTS = 9999999999;
const categories = new Set(EXPENSE_CATEGORIES.map(([code]) => code));
export const newExpense = () => ({ id: crypto.randomUUID(), category: '', amount: '', details: '' });
// Parse decimal digits directly: floating point euros are never multiplied by 100.
export function parseExpenseCents(value) {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Saisissez un montant positif ou nul, avec deux décimales maximum.');
  const [whole, fraction = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > MAX_EXPENSE_CENTS) throw new Error('Le montant maximum est de 99 999 999,99 €.');
  return cents;
}
export function centsToDecimal(cents) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
export function formatExpenseCents(cents) {
  const [whole, fraction] = centsToDecimal(cents).split('.');
  return `${Number(whole).toLocaleString('fr-FR')},${fraction} €`;
}
export function expenseDraft(items = []) {
  return items.map(item => ({ id: item.id, category: item.category, amount: item.amount_cents == null ? '' : centsToDecimal(item.amount_cents), details: item.details, legacyMissingAmount: item.amount_cents === null }));
}
export const isEmptyExpense = row => !row.category && !String(row.amount ?? '').trim() && !String(row.details ?? '').trim();
export function expenseError(row) {
  if (isEmptyExpense(row)) return '';
  if (!categories.has(row.category)) return 'Choisissez une catégorie.';
  try {
    if (parseExpenseCents(row.amount) === null && !row.legacyMissingAmount) return 'Renseignez le montant, y compris s’il est nul.';
  } catch (error) { return error.message; }
  if (typeof row.details !== 'string' || row.details.length > 5000) return 'La précision est limitée à 5 000 caractères.';
  if (row.category === 'other' && !row.details.trim()) return 'Précisez la nature de ces autres frais.';
  return '';
}
export function expenseTotal(rows) {
  return rows.reduce((sum, row) => {
    try { return sum + (parseExpenseCents(row.amount) ?? 0); } catch { return sum; }
  }, 0);
}
export function validateExpenses(rows = []) {
  if (!Array.isArray(rows)) throw new Error('Liste des dépenses invalide.');
  const ids = new Set();
  const result = rows.flatMap((row, index) => {
    if (isEmptyExpense(row)) return [];
    const error = expenseError(row);
    if (error) throw new Error(`Dépense ${index + 1} : ${error}`);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id) || ids.has(row.id)) throw new Error('Identifiant de dépense invalide ou dupliqué.');
    ids.add(row.id);
    return [{ id: row.id, category: row.category, amount_cents: parseExpenseCents(row.amount), details: row.details }];
  });
  if (result.reduce((sum, row) => sum + (row.amount_cents ?? 0), 0) > MAX_EXPENSE_CENTS) throw new Error('Le total des frais dépasse 99 999 999,99 €.');
  return result;
}
