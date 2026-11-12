export function parisToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
const numberOrNull = (value, label, max = 99999999.99, integer = false) => {
  if (value === '' || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max || (integer && !Number.isInteger(n)) || Math.abs(n * 100 - Math.round(n * 100)) > 0.00001) {
    throw new Error(`${label} : saisissez ${integer ? 'un entier' : 'un nombre (deux décimales maximum)'} entre 0 et ${max}.`);
  }
  return n;
};
const clean = (value, max) => {
  const result = String(value ?? '').trim();
  if (result.length > max) throw new Error(`Texte trop long : ${max} caractères maximum.`);
  return result;
};
export function newActivitySession(mission, withDates = true) {
  return { id: crypto.randomUUID(), formation: mission.formation || mission.mission_title || '', group_label: '', learner_count: null, expected_learners: null,
    days: (withDates && mission.dates?.length ? mission.dates : [{ date: '' }]).map(d => ({ date: d.date, status: 'pending', actual_hours: null, planned_hours: null })) };
}
export function initialActivity(mission, origin) {
  const fee = origin === 'personal' && mission.fee_unit === 'mission' ? mission.fee : null;
  return { declared_fee: fee ?? null, tax_basis: fee == null ? null : 'HT', observations: '', expenses: null, expense_details: '', kilometers: null, difficulties: '', sessions: [newActivitySession(mission)] };
}
export function validateActivity(input, today = parisToday()) {
  const declared_fee = numberOrNull(input.declared_fee, 'Montant déclaré');
  if (declared_fee != null && !['HT', 'TTC'].includes(input.tax_basis)) throw new Error('Précisez HT ou TTC pour le montant déclaré.');
  if (!input.sessions?.length || input.sessions.length > 100) throw new Error('Prévoyez entre 1 et 100 sessions.');
  const ids = new Set();
  return { declared_fee, tax_basis: declared_fee == null ? null : input.tax_basis,
    observations: clean(input.observations, 5000), expenses: numberOrNull(input.expenses, 'Frais'), expense_details: clean(input.expense_details, 5000),
    kilometers: numberOrNull(input.kilometers, 'Kilométrage'), difficulties: clean(input.difficulties, 5000),
    sessions: input.sessions.map(s => {
      if (!s.id || ids.has(s.id)) throw new Error('Identifiant de session dupliqué.');
      ids.add(s.id);
      if (!s.days?.length || s.days.length > 100) throw new Error('Chaque session doit comporter entre 1 et 100 dates.');
      const seen = new Set();
      return { id: s.id, formation: clean(s.formation, 200), group_label: clean(s.group_label, 200),
        learner_count: numberOrNull(s.learner_count, 'Effectif réel', 100000, true), expected_learners: numberOrNull(s.expected_learners, 'Effectif prévu', 100000, true),
        days: s.days.map(d => {
          const parsed = new Date(`${d.date}T12:00:00Z`);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== d.date || d.date < '2000-01-01' || d.date > '2100-12-31' || seen.has(d.date)) throw new Error('Chaque date doit être valide et unique dans sa session (2000 à 2100).');
          seen.add(d.date);
          if (!['pending', 'done', 'not_done'].includes(d.status)) throw new Error('Précisez l’état de la journée.');
          if (d.status === 'done' && d.date > today) throw new Error('Une journée future ne peut pas être déclarée réalisée.');
          const actual_hours = numberOrNull(d.actual_hours, 'Durée réelle', 24);
          if (d.status !== 'done' && actual_hours != null) throw new Error('Confirmez la réalisation avant de renseigner sa durée réelle.');
          return { date: d.date, status: d.status, actual_hours, planned_hours: numberOrNull(d.planned_hours, 'Durée prévue', 24) };
        }).sort((a, b) => a.date.localeCompare(b.date)) };
    }) };
}
export function sessionState(session, today = parisToday()) {
  const days = session.days || [];
  const done = days.filter(d => d.status === 'done').length;
  if (done === days.length && done) return 'Terminée';
  if (done && days.some(d => d.status === 'pending' && d.date >= today)) return 'En cours · partiellement réalisée';
  if (done) return 'Partiellement réalisée';
  if (days.length && days.every(d => d.status === 'not_done')) return 'Non réalisée';
  return days.some(d => d.date < today && d.status === 'pending') ? 'À compléter' : 'À renseigner';
}
export function activityNeedsCompletion(sessions, today = parisToday()) {
  return sessions.some(s => s.days.some(d => (d.status === 'pending' && d.date < today) || (d.status === 'done' && d.actual_hours == null)) || (s.days.some(d => d.status === 'done') && (s.learner_count == null || !s.formation.trim())));
}
export function activityKey(m) { return `${m.origin || 'organization'}:${m.mission_id || m.id}`; }
export function reportKey(r) { return `${r.personal_mission_id ? 'personal' : 'organization'}:${r.personal_mission_id || r.mission_id}`; }
export function agreedFee(m, origin) {
  return origin === 'personal' ? { amount: m.fee ?? null, unit: m.fee_unit, tax_basis: m.fee == null ? null : 'HT' } : { amount: m.offered_fee ?? null, unit: null, tax_basis: null };
}
export function feeLabel(fee) {
  if (fee?.amount == null) return 'Non renseigné';
  return `${fee.amount} € ${fee.tax_basis || '(HT/TTC non précisé)'} / ${{ mission: 'mission', day: 'jour', hour: 'heure' }[fee.unit] || 'unité non précisée'}`;
}
// Counts are scoped per period; attendees and money use a unique anchor, never a daily prorata.
export function calculateActivity(missions, reports, start, end, today = parisToday()) {
  const inPeriod = d => d >= start && d <= end;
  const byMission = new Map(reports.map(r => [reportKey(r), r]));
  const result = { realized: { missions: 0, sessions: 0, completed: 0, partial: 0, ongoing: 0, days: 0, hours: 0, missingHours: 0, learners: 0, missingLearners: 0, learnersOutside: 0 },
    future: { missions: 0, sessions: 0, days: 0, hours: 0, missingHours: 0, learners: 0, missingLearners: 0, learnersOutside: 0, fees: { HT: 0, TTC: 0 }, missingFees: 0, feesOutside: 0 }, pending: [], retained: [], options: 0 };
  const seen = new Set();
  const missionKeys = new Set(missions.map(activityKey));
  const retained = reports.filter(r => !missionKeys.has(reportKey(r))).map(r => ({ origin: r.personal_mission_id ? 'personal' : 'organization', mission_id: r.personal_mission_id || r.mission_id, mission_title: r.sessions[0]?.formation || 'Bilan conservé', status: 'historical', dates: [], report_id: r.id }));
  for (const m of [...missions, ...retained]) {
    const key = activityKey(m);
    if (seen.has(key)) continue;
    seen.add(key);
    const report = byMission.get(key);
    const confirmed = m.status === 'affecte';
    const contractDays = (m.dates || []).map(d => d.date).sort();
    if (['accepte', 'proposition_envoyee'].includes(m.status) && contractDays.some(d => d >= today && inPeriod(d))) result.options++;
    if (!confirmed && !report) continue;
    const sessions = report?.sessions || [{ id: 'default', formation: m.formation || m.mission_title || '', learner_count: null, expected_learners: null, days: contractDays.map(date => ({ date, status: 'pending', actual_hours: null, planned_hours: null })) }];
    let hasRealized = false, hasFuture = false, missing = false;
    for (const s of sessions) {
      const allDone = s.days.filter(d => d.status === 'done' && d.date <= today).sort((a, b) => a.date.localeCompare(b.date));
      const done = allDone.filter(d => inPeriod(d.date));
      const upcoming = confirmed ? s.days.filter(d => d.status === 'pending' && d.date >= today && inPeriod(d.date)) : [];
      if (done.length) {
        hasRealized = true;
        const a = result.realized;
        a.sessions++; a.days += done.length;
        const state = sessionState(s, today);
        if (state === 'Terminée') a.completed++; else { a.partial++; if (state.startsWith('En cours')) a.ongoing++; }
        for (const d of done) { if (d.actual_hours == null) a.missingHours++; else a.hours += Number(d.actual_hours); }
        if (inPeriod(allDone[0].date)) { if (s.learner_count == null) a.missingLearners++; else a.learners += Number(s.learner_count); } else a.learnersOutside++;
      }
      if (upcoming.length) {
        hasFuture = true;
        const a = result.future;
        a.sessions++; a.days += upcoming.length;
        for (const d of upcoming) { if (d.planned_hours == null) a.missingHours++; else a.hours += Number(d.planned_hours); }
        const first = s.days.map(d => d.date).sort()[0];
        if (first >= today && inPeriod(first)) { if (s.expected_learners == null) a.missingLearners++; else a.learners += Number(s.expected_learners); } else a.learnersOutside++;
      }
      if (activityNeedsCompletion([{ ...s, days: s.days.filter(d => inPeriod(d.date)) }], today)) missing = true;
    }
    if (hasRealized) result.realized.missions++;
    if (hasFuture) {
      const a = result.future;
      a.missions++;
      const fee = report?.agreed_fee || agreedFee(m, m.origin);
      if (fee.amount == null || fee.unit !== 'mission' || !['HT', 'TTC'].includes(fee.tax_basis)) a.missingFees++;
      else if (contractDays[0] >= today && inPeriod(contractDays[0])) a.fees[fee.tax_basis] += Number(fee.amount);
      else a.feesOutside++;
    }
    if (missing) result.pending.push(m);
    if (m.report_id && sessions.some(s => s.days.some(d => inPeriod(d.date)))) result.retained.push(m);
  }
  for (const a of [result.realized, result.future]) a.hours = Math.round(a.hours * 100) / 100;
  return result;
}
