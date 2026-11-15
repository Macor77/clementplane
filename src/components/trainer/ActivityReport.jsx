import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getActivityReport, getOrganizationActivityReports, saveActivityReport } from '../../services/trainerActivityService';
import { agreedFee, feeLabel, initialActivity, activityDraft, parisToday, sessionState } from '../../utils/trainerActivity';
import ExpenseFields from './ExpenseFields';
import '../../styles/trainerActivity.css';

const shown = value => value == null || value === '' ? 'Non renseigné' : value;
const summaryLabels = { pending: 'À renseigner', done: 'Réalisée', partial: 'Partiellement réalisée', not_done: 'Non réalisée' };
const dayLabels = { pending: 'À renseigner', done: 'Réalisée', not_done: 'Non réalisée' };
function NumberField({ label, value, onChange, integer = false, max = 99999999.99, disabled = false }) {
  return <label>{label}<input type="number" inputMode={integer ? 'numeric' : 'decimal'} min="0" max={max} step={integer ? '1' : '0.01'} value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} /></label>;
}
function FeeNotice({ source, input }) {
  const comparable = source?.amount != null && source.unit === 'mission' && source.tax_basis === input.tax_basis && input.declared_fee != null && input.declared_fee !== '';
  return <><p>Tarif convenu conservé : <strong>{feeLabel(source)}</strong></p>
    {input.declared_fee != null && input.declared_fee !== '' && <p className="activity-notice">{comparable ? (Number(source.amount) !== Number(input.declared_fee) ? `Le montant déclaré diffère du tarif convenu (${Number(input.declared_fee) - Number(source.amount)} € ${input.tax_basis}).` : 'Le montant déclaré correspond au tarif convenu.') : 'La comparaison nécessite la même unité et la même base HT/TTC. Aucun montant n’est converti automatiquement.'}</p>}
    <p>Le bilan ne modifie pas le contrat et ne vaut ni facture ni acceptation du montant par l’OF.</p></>;
}
export default function ActivityReport({ mission, origin }) {
  const { trainerProfile } = useAuth();
  const missionId = mission.mission_id || mission.id;
  const [input, setInput] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  const busy = useRef(false);
  const mutation = useRef(null);
  // Only identity changes reload the report. Mission/auth refreshes must not overwrite a draft.
  const missionRef = useRef(mission); missionRef.current = mission;
  useEffect(() => {
    let active = true;
    setLoading(true);
    getActivityReport(origin, missionId, trainerProfile?.id).then(result => {
      if (!active) return;
      setReport(result?.report || null);
      setInput(result ? activityDraft(result.report, result.private, { ...missionRef.current, origin }) : initialActivity(missionRef.current, origin));
      setError(''); setDirty(false); setSaved(false);
    }).catch(() => { if (active) setError('Impossible de charger le bilan. Réessayez avant de saisir des modifications.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [origin, missionId, trainerProfile?.id, reload]);
  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const change = next => { setInput(next); setDirty(true); setSaved(false); mutation.current = null; };
  const field = (name, value) => change({ ...input, [name]: value });
  const session = (index, next) => change({ ...input, sessions: input.sessions.map((s, i) => i === index ? next : s) });
  async function save(e) {
    e.preventDefault(); if (busy.current) return;
    busy.current = true; setSaving(true); setError(''); setSaved(false);
    mutation.current ||= crypto.randomUUID();
    try {
      const result = await saveActivityReport(origin, missionId, report?.revision ?? null, mutation.current, input);
      setReport(result.report); setInput(activityDraft(result.report, result.private, { ...missionRef.current, origin })); setDirty(false); setSaved(true); mutation.current = null;
    } catch (err) { setError(err.message); } finally { busy.current = false; setSaving(false); }
  }
  const privateMission = origin === 'personal';
  const source = report?.agreed_fee || agreedFee(mission, origin);
  return <section className="activity-report" id="bilan" aria-labelledby="activity-title">
    <h2 id="activity-title">Bilan de la mission</h2>
    <p>Une mission correspond à une session et un seul groupe, sur une ou plusieurs journées. Les champs vides restent « Non renseigné ».</p>
    {loading && <p role="status">Chargement du bilan…</p>}
    {error && <p className="activity-error" role="alert">{error}</p>}
    {!loading && !input && <button type="button" onClick={() => setReload(v => v + 1)}>Réessayer le chargement</button>}
    {!loading && input && !privateMission && mission.status !== 'affecte' && !report && <p>Aucun bilan enregistré. La création du bilan sera disponible après confirmation de l’affectation.</p>}
    {!loading && input && (privateMission || mission.status === 'affecte' || report) && <form onSubmit={save}>
      <fieldset disabled={saving}>
        <legend>{privateMission ? 'Privé — vous uniquement' : 'Visible par l’OF commanditaire'}</legend>
        <p>{privateMission ? 'Ce bilan reste privé, même si le donneur d’ordre figure dans Mes OF.' : 'Les informations de cette section sont consultables par l’OF dès l’enregistrement réussi. Lui seul peut les consulter avec vous ; il ne peut pas les modifier.'} Aucun e-mail ni notification n’est envoyé.</p>
        <FeeNotice source={source} input={input} />
        <div className="activity-grid">
          <NumberField label="Tarif total déclaré (€)" value={input.declared_fee} onChange={v => field('declared_fee', v)} />
          <label>Base du montant déclaré<select value={input.tax_basis || ''} onChange={e => field('tax_basis', e.target.value || null)}><option value="">À préciser</option><option>HT</option><option>TTC</option></select></label>
        </div>
        <label>{privateMission ? 'Observations sur la mission (privées)' : 'Observations partagées avec l’OF'}<textarea maxLength={5000} value={input.observations} onChange={e => field('observations', e.target.value)} /></label>
        <p>Formation : <strong>{report?.formation_title || mission.formation || mission.mission_title || 'Formation non renseignée'}</strong></p>
        <p>Dates de référence : {(input.reference_dates || mission.dates?.map(d => d.date) || []).join(' · ') || 'Non renseignées'}</p>
        {input.summary ? <fieldset className="activity-session"><legend>Réalisation de la formation</legend>
          <label>Formation réalisée<select value={input.summary.status} onChange={e => field('summary', { ...input.summary, status: e.target.value,
            ...(!['done', 'partial'].includes(e.target.value) ? { learner_count: null, actual_days: null, actual_hours: null } : {}) })}>
            {Object.entries(summaryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <div className="activity-grid">
            <NumberField label="Apprenants effectivement formés" value={input.summary.learner_count} integer max={100000} disabled={!['done', 'partial'].includes(input.summary.status)} onChange={v => field('summary', { ...input.summary, learner_count: v })} />
            <NumberField label="Durée réellement animée (jours)" value={input.summary.actual_days} max={10000} disabled={!['done', 'partial'].includes(input.summary.status)} onChange={v => field('summary', { ...input.summary, actual_days: v })} />
            <NumberField label="Durée réellement animée (heures)" value={input.summary.actual_hours} max={240000} disabled={!['done', 'partial'].includes(input.summary.status)} onChange={v => field('summary', { ...input.summary, actual_hours: v })} />
          </div>
          <p>Indiquez les totaux pour ce groupe, par exemple 2 jours et 14 heures, ou 0,5 jour et 3 heures. Aucune conversion automatique. Comptez chaque apprenant une seule fois, sans saisir son identité.</p>
          {report?.report_mode === 'detailed' && <p>L’ancien détail sera conservé. Vérifiez les totaux et renseignez le nombre de jours réellement animés avant d’enregistrer.</p>}
        </fieldset> : <><p>Ce bilan historique comporte plusieurs groupes. Leur détail est conservé pour permettre les corrections sans regrouper les effectifs.</p>
        {input.sessions.map((s, i) => <fieldset className="activity-session" key={s.id}>
          <legend>Groupe historique {i + 1} · {sessionState(s)}</legend>
          <p>Formation historique : <strong>{s.formation || 'Non renseignée'}</strong></p>
          {s.group_label && <p>{s.group_label}</p>}
          <NumberField label={`Apprenants effectivement formés — groupe ${i + 1}`} value={s.learner_count} integer max={100000} onChange={v => session(i, { ...s, learner_count: v })} />
          {s.days.map((d, j) => {
            const changeDay = values => session(i, { ...s, days: s.days.map((day, k) => k === j ? { ...day, ...values } : day) });
            const suffix = `groupe ${i + 1}, journée ${j + 1}`;
            return <div className="activity-day" key={d.date}><p>{d.date}</p><div className="activity-grid">
              <label>Réalisation — {suffix}<select value={d.status} onChange={e => changeDay({ status: e.target.value, actual_hours: e.target.value === 'done' ? d.actual_hours : null })}>{Object.entries(dayLabels).map(([value, label]) => <option key={value} value={value} disabled={value === 'done' && d.date > parisToday()}>{label}</option>)}</select></label>
              <NumberField label={`Durée réellement animée (h) — ${suffix}`} value={d.actual_hours} max={24} disabled={d.status !== 'done'} onChange={v => changeDay({ actual_hours: v })} />
            </div></div>;
          })}
        </fieldset>)}</>}
      </fieldset>
      <fieldset className="activity-private" disabled={saving}><legend>Privé — vous uniquement</legend>
        <p>Ces informations ne sont accessibles à aucun OF et ne sont pas ajoutées aux agendas.</p>
        <ExpenseFields rows={input.expense_items} onChange={v => field('expense_items', v)} legacyAmount={input.legacy_expenses} legacyDetails={input.legacy_expense_details} />
        <div className="activity-grid">
          <NumberField label="Kilométrage total réel de la mission (km)" value={input.kilometers} onChange={v => field('kilometers', v)} /></div>
        <p>Incluez tous vos déplacements, allers et retours. La distance indicative de Clementplane est à vol d’oiseau ; elle ne permet pas de préremplir ce kilométrage routier. Aucune conversion en frais.</p>
        <label>Difficultés rencontrées<textarea maxLength={5000} value={input.difficulties} onChange={e => field('difficulties', e.target.value)} /></label>
      </fieldset>
      <div className="activity-save"><button className="button button--primary" disabled={saving} type="submit">{saving ? 'Enregistrement…' : 'Enregistrer le bilan'}</button>
        <span role="status">{saving ? 'En attente de confirmation du serveur…' : saved ? 'Bilan enregistré.' : dirty ? 'Modifications non enregistrées.' : ''}</span></div>
      {report?.updated_at && <p>Dernière modification : {new Date(report.updated_at).toLocaleString('fr-FR')}</p>}
    </form>}
  </section>;
}

export function OrganizationActivityReports({ missionId }) {
  const [rows, setRows] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getOrganizationActivityReports(missionId).then(data => { if (active) setRows(data); }).catch(() => { if (active) setError('Bilans indisponibles. Rechargez la page pour réessayer.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [missionId]);
  return <section className="activity-report" aria-label="Bilans des formateurs"><h2>Bilans des formateurs</h2><p>Lecture seule · Données déclarées par le formateur après enregistrement. Aucun montant ne vaut facture ou accord de votre organisme.</p>
    {loading && <p role="status">Chargement…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && !rows.length && <p>Aucun bilan enregistré pour cette mission.</p>}
    {rows.map(r => <article key={r.id} className="activity-session"><h3>Bilan de {r.trainer_name || 'Formateur'}</h3><FeeNotice source={r.agreed_fee} input={r} /><p>Tarif total déclaré : <strong>{r.declared_fee == null ? 'Non renseigné' : `${r.declared_fee} € ${r.tax_basis}`}</strong></p><p>Observations : {shown(r.observations)}</p>
      <h4>{r.formation_title || r.sessions[0]?.formation || 'Formation non renseignée'}</h4>
      {r.report_mode === 'simple' ? <><p>{summaryLabels[r.summary.status]} · Apprenants effectivement formés : {shown(r.summary.learner_count)}</p>
        <p>Durée réellement animée : {shown(r.summary.actual_days)} jours · {shown(r.summary.actual_hours)} heures</p></> : r.sessions.map((s, i) => <section key={s.id}><h4>Groupe historique {i + 1} · {s.formation || 'Formation non renseignée'} {s.group_label && `· ${s.group_label}`}</h4><p>{sessionState(s)} · Apprenants effectivement formés : {shown(s.learner_count)}</p><ul>{s.days.map(d => <li key={d.date}>{d.date} · {dayLabels[d.status]} · Durée réelle : {shown(d.actual_hours)}{d.actual_hours != null && ' h'}</li>)}</ul></section>)}
      <p>Dernière modification : {new Date(r.updated_at).toLocaleString('fr-FR')}</p></article>)}
  </section>;
}
