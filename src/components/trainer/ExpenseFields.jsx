import { EXPENSE_CATEGORIES, MAX_EXPENSE_CENTS, expenseError, expenseTotal, formatExpenseCents, newExpense } from '../../utils/trainerExpenses';
import ActivityHelp from './ActivityHelp';

export default function ExpenseFields({ rows, onChange, legacyAmount, legacyDetails }) {
  const update = (index, values) => onChange(rows.map((row, i) => i === index ? { ...row, ...values } : row));
  const total = expenseTotal(rows);
  const incomplete = rows.some(row => expenseError(row) || (row.legacyMissingAmount && !row.amount.trim()));
  return <section className="activity-expenses" aria-label="Frais engagés">
    <div className="activity-help-heading"><h3>Frais engagés</h3>
      <ActivityHelp title="Frais engagés"><p>Ajoutez vos dépenses, puis enregistrez le bilan. Une même catégorie peut être utilisée plusieurs fois.</p><p>La précision est facultative, sauf pour « Autres frais ». Le total est calculé automatiquement et peut être de 0 €. Les lignes entièrement vides ne sont pas comptabilisées.</p><p>Renseignez des montants positifs ou nuls, avec au maximum deux décimales. Aucun justificatif n’est demandé.</p></ActivityHelp>
    </div>
    {!rows.length && <p>Aucune dépense renseignée.</p>}
    {rows.map((row, index) => {
      const error = expenseError(row), errorId = `expense-${row.id}-error`;
      return <div className="activity-expense-row" role="group" aria-label={`Dépense ${index + 1}`} key={row.id}>
        <div className="activity-expense-fields">
          <label>Catégorie de dépense<select aria-label={`Catégorie de dépense ${index + 1}`} value={row.category} onChange={e => update(index, { category: e.target.value })}>
            <option value="">Choisir une catégorie</option>{EXPENSE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>Montant (€)<input aria-label={`Montant de la dépense ${index + 1} (€)`} inputMode="decimal" type="text" placeholder="0,00" value={row.amount} aria-describedby={error ? errorId : undefined} onChange={e => update(index, { amount: e.target.value })} /></label>
          <label>Précision {row.category === 'other' ? '(obligatoire)' : '(facultative)'}<textarea rows={2} maxLength={5000} aria-label={`Précision de la dépense ${index + 1}`} value={row.details} onChange={e => update(index, { details: e.target.value })} /></label>
          <button className="activity-remove" type="button" aria-label={`Supprimer la dépense ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Supprimer</button>
        </div>
        {error && <p className="activity-expense-error" id={errorId}>{error}</p>}
        {row.legacyMissingAmount && !row.amount.trim() && <p>Ancienne dépense sans montant : conservée, mais non incluse dans le total. Vous pouvez la compléter.</p>}
      </div>;
    })}
    <button type="button" onClick={() => onChange([...rows, newExpense()])}>+ Ajouter une dépense</button>
    <p className="activity-expense-total">Total des frais engagés : <output aria-label="Total des frais engagés" aria-live="polite">{formatExpenseCents(total)}</output></p>
    {incomplete && <p>Le total tient compte des montants valides renseignés. Vérifiez les lignes incomplètes.</p>}
    {total > MAX_EXPENSE_CENTS && <p className="activity-expense-error">Le total des frais dépasse 99 999 999,99 €.</p>}
    {(legacyAmount != null || legacyDetails) && <details className="activity-expense-legacy"><summary>Ancienne saisie conservée</summary>
      <p>Montant d’origine : {legacyAmount == null ? 'Non renseigné' : Number(legacyAmount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'}</p>
      {legacyDetails && <p className="activity-expense-original">{legacyDetails}</p>}
      <p>Cette archive reste disponible après modification des lignes. Elle ne s’ajoute pas au total.</p>
    </details>}
  </section>;
}
