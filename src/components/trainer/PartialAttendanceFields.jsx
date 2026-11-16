import { useEffect, useRef } from 'react';
import { newPartialAttendance, partialLearnerTotal } from '../../utils/partialAttendance';
import ActivityHelp from './ActivityHelp';

export default function PartialAttendanceFields({ rows, onChange, realized, error, saveAttempts }) {
  const details = useRef(null);
  useEffect(() => { if (error?.startsWith('Apprenants partiellement formés') && details.current) details.current.open = true; }, [error, saveAttempts]);
  const total = partialLearnerTotal(rows);
  const update = (index, key, value) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  return <details className="activity-partial-attendance" ref={details}>
    <summary>Apprenants partiellement formés{total > 0 && <span> · {total}</span>}</summary>
    <div className="activity-help-heading"><p className="activity-essential-note">À compter séparément des apprenants entièrement formés.</p>
      <ActivityHelp title="Apprenants partiellement formés">
        <p>Ces personnes ne sont pas incluses dans le nombre d’apprenants entièrement formés. Le total des participants additionne les deux décomptes, sans compter une personne deux fois.</p>
        <p>Une ligne regroupe les personnes ayant suivi la même durée. Par exemple : 1 apprenant pendant 1 heure, puis 3 apprenants pendant 3 heures. Indiquez la durée suivie par chaque personne de la ligne, sans la multiplier par l’effectif.</p>
        <p>Renseignez les jours et les heures connus, sans conversion automatique. Au moins une durée est nécessaire pour chaque ligne. Ces durées ne s’ajoutent pas au temps animé par le formateur.</p>
      </ActivityHelp>
    </div>
    {!realized && <p>Confirmez la réalisation de la formation pour compléter ce détail. Les lignes déjà saisies restent conservées ; retirez-les si la formation n’a pas eu lieu.</p>}
    {rows.map((row, index) => <div className="activity-partial-row" role="group" aria-label={`Participation partielle ${index + 1}`} key={row.id}>
      <div className="activity-partial-fields">
        <label>Nombre d’apprenants<input type="text" inputMode="numeric" aria-label={`Nombre d’apprenants partiellement formés — ligne ${index + 1}`} value={row.learner_count ?? ''} disabled={!realized} onChange={e => update(index, 'learner_count', e.target.value)} /></label>
        <label>Durée suivie (jours)<input type="text" inputMode="decimal" aria-label={`Durée suivie en jours — ligne ${index + 1}`} value={row.actual_days ?? ''} disabled={!realized} onChange={e => update(index, 'actual_days', e.target.value)} /></label>
        <label>Durée suivie (heures)<input type="text" inputMode="decimal" aria-label={`Durée suivie en heures — ligne ${index + 1}`} value={row.actual_hours ?? ''} disabled={!realized} onChange={e => update(index, 'actual_hours', e.target.value)} /></label>
        <button type="button" className="activity-remove" aria-label={`Supprimer la participation partielle ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Supprimer</button>
      </div>
    </div>)}
    <button type="button" disabled={!realized} onClick={() => onChange([...rows, newPartialAttendance()])}>+ Ajouter une ligne</button>
    {total > 0 && <p><strong>{total} apprenant{total > 1 ? 's' : ''} partiellement formé{total > 1 ? 's' : ''}</strong></p>}
  </details>;
}

export function PartialAttendanceReadOnly({ rows = [] }) {
  if (!rows.length) return null;
  return <details className="activity-partial-attendance"><summary>Apprenants partiellement formés · {partialLearnerTotal(rows)}</summary>
    <p>Comptés séparément des apprenants entièrement formés. Durée suivie par personne, sans ajout au temps animé par le formateur.</p>
    <ul>{rows.map(row => <li key={row.id}>{row.learner_count} apprenant{row.learner_count > 1 ? 's' : ''} · {row.actual_days == null ? 'Jours non renseignés' : `${Number(row.actual_days).toLocaleString('fr-FR')} jour(s)`} · {row.actual_hours == null ? 'Heures non renseignées' : `${Number(row.actual_hours).toLocaleString('fr-FR')} heure(s)`}</li>)}</ul>
  </details>;
}
