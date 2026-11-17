import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import StatisticsDialog from './StatisticsDialog';
import { dateLabel, numberLabel } from '../../utils/trainerStatistics';
import { formatExpenseCents } from '../../utils/trainerExpenses';

export function StatisticsRows({ rows, renderValue, pending = false }) {
  return rows.length ? <ul className="statistics-rows">{rows.map((entry, i) => <li key={`${entry.key}:${i}`}>
    <Link to={entry.href}><span className="statistics-row-title">{entry.title}</span><span className="statistics-row-meta">{entry.organization} · Fin : {dateLabel(entry.endDate)}</span>
      {pending && <span className="statistics-row-reasons">{entry.reasons.join(' · ')}</span>}
      {renderValue && <span className="statistics-row-value">{renderValue(entry)}</span>}
      <span className="statistics-row-action">{pending ? 'Compléter le bilan' : 'Voir le bilan'} <span aria-hidden="true">→</span></span>
    </Link></li>)}</ul> : <p>Aucune mission sur cette période.</p>;
}

export default function StatisticsDetails({ detail, finance, onClose, onCategory }) {
  const back = useRef(null);
  useEffect(() => { if (detail.category) back.current?.focus({ preventScroll: true }); }, [detail.category]);
  return <StatisticsDialog title={detail.title} onClose={onClose}>
    {detail.type === 'expenses' && <>
      {detail.category ? <><button ref={back} className="statistics-back" onClick={() => onCategory(null)}>← Toutes les catégories</button>
        <ul className="statistics-expense-lines">{finance.expenseItems.filter(row => row.category === detail.category).map((row, i) => <li key={`${row.entry.key}:${row.id || i}`}>
          <strong>{row.amount_cents == null ? 'Montant non renseigné' : formatExpenseCents(row.amount_cents)}</strong>
          {row.details && <p className="statistics-expense-note">{row.details}</p>}
          <Link to={row.entry.href}>{row.entry.title}</Link><small>{row.entry.organization} · Fin : {dateLabel(row.entry.endDate)}</small>
        </li>)}</ul></> : <>
        <p className="statistics-detail-total">{formatExpenseCents(finance.expenses)}</p>
        {finance.categories.length ? <ul className="statistics-categories">{finance.categories.map(category => <li key={category.code}>
          <button onClick={() => onCategory(category.code)}><span>{category.label} <span aria-hidden="true">›</span></span><b>{formatExpenseCents(category.amount)}</b>
            <span className="statistics-bar-track" aria-hidden="true"><span style={{ width: `${finance.expenses ? category.amount / finance.expenses * 100 : 0}%` }} /></span>
            <small>{finance.expenses ? numberLabel(category.amount / finance.expenses * 100) : '0'} % · {category.count} dépense(s)</small></button>
        </li>)}</ul> : <p>Aucune dépense déclarée sur cette période.</p>}
      </>}
      {finance.missingExpenses.length > 0 && <p role="status">{finance.missingExpenses.length} dépense(s) ancienne(s) sans montant, exclue(s) du total.</p>}
      {finance.unavailableExpenses.length > 0 && <p role="status">{finance.unavailableExpenses.length} bilan(s) sans données de frais disponibles.</p>}
    </>}
    {detail.type === 'rows' && <><p className="statistics-detail-period">{detail.subtitle}</p><StatisticsRows rows={detail.rows} renderValue={detail.renderValue} pending={detail.pending} /></>}
  </StatisticsDialog>;
}
