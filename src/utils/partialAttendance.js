const prefix = 'Apprenants partiellement formés';
const fail = message => { throw new Error(`${prefix} : ${message}`); };
const blank = value => value == null || String(value).trim() === '';
export const newPartialAttendance = () => ({ id: crypto.randomUUID(), learner_count: '', actual_days: '', actual_hours: '' });
export const isEmptyPartialAttendance = row => ['learner_count', 'actual_days', 'actual_hours'].every(key => blank(row[key]));
function positiveNumber(value, label, max, integer = false) {
  if (blank(value)) return null;
  const text = String(value).trim().replace(',', '.');
  const number = Number(text);
  if (!(integer ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/).test(text) || !Number.isFinite(number) || number <= 0 || number > max) {
    fail(`${label} doit être ${integer ? 'un entier' : 'un nombre (deux décimales maximum)'} supérieur à zéro et inférieur ou égal à ${max}.`);
  }
  return number;
}
export function partialLearnerTotal(rows = []) {
  return rows.reduce((sum, row) => {
    const value = String(row.learner_count ?? '').trim();
    const number = Number(value);
    return /^\d+$/.test(value) && Number.isSafeInteger(number) && number > 0 && number <= 100000 ? sum + number : sum;
  }, 0);
}
// Persisted learner_count remains the inclusive total for existing reports/clients.
// The editable form presents complete and partial attendance as separate counts.
export function fullyTrainedCount(total, rows = []) {
  if (blank(total)) return null;
  const complete = Number(total) - partialLearnerTotal(rows);
  return Number.isSafeInteger(complete) && complete >= 0 ? complete : null;
}
export function validatePartialAttendance(rows = [], summary) {
  if (!Array.isArray(rows)) fail('liste invalide.');
  const ids = new Set();
  const result = rows.flatMap((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail('ligne invalide.');
    if (isEmptyPartialAttendance(row)) return [];
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id) || ids.has(row.id.toLowerCase())) fail('identifiant de ligne invalide ou dupliqué.');
    ids.add(row.id.toLowerCase());
    const learner_count = positiveNumber(row.learner_count, `Le nombre d’apprenants de la ligne ${index + 1}`, 100000, true);
    const actual_days = positiveNumber(row.actual_days, `La durée en jours de la ligne ${index + 1}`, 10000);
    const actual_hours = positiveNumber(row.actual_hours, `La durée en heures de la ligne ${index + 1}`, 240000);
    if (learner_count == null) fail(`renseignez le nombre d’apprenants de la ligne ${index + 1}.`);
    if (actual_days == null && actual_hours == null) fail(`renseignez au moins une durée (jours ou heures) pour la ligne ${index + 1}.`);
    for (const [key, amount] of [['actual_days', actual_days], ['actual_hours', actual_hours]]) {
      if (amount != null && summary?.[key] != null && amount > Number(summary[key])) fail(`la durée de la ligne ${index + 1} dépasse la durée réellement animée.`);
    }
    return [{ id: row.id, learner_count, actual_days, actual_hours }];
  });
  if (result.length) {
    if (!summary || !['done', 'partial'].includes(summary.status)) fail('confirmez la réalisation de la formation, ou retirez ces lignes si elle n’a pas eu lieu.');
    if (blank(summary.learner_count)) fail('renseignez le nombre d’apprenants entièrement formés, ou 0 si aucun n’a suivi toute la formation.');
    if (partialLearnerTotal(result) + Number(summary.learner_count) > 100000) fail('le total des participants ne peut pas dépasser 100 000.');
  }
  return result;
}
