export const feeUnitLabels = { mission: 'mission', day: 'jour', hour: 'heure' };

function clean(value) {
  return String(value || '').trim();
}

export function formatPersonalMissionLocation(input) {
  const cityLine = [clean(input.postal_code), clean(input.city)].filter(Boolean).join(' ');
  return [clean(input.site_name), clean(input.address), cityLine].filter(Boolean).join(', ');
}

function normalizeOrganizationName(value) {
  return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLocaleLowerCase('fr');
}

export function shouldSuggestOrganization(name, contacts = []) {
  const normalized = normalizeOrganizationName(name);
  return Boolean(normalized) && !contacts.some(contact => normalizeOrganizationName(contact.organization_name) === normalized);
}

export function validatePersonalMission(input) {
  const title = clean(input.title);
  if (!title || title.length > 200) throw new Error('Renseignez un client final de 1 à 200 caractères.');
  if (!Array.isArray(input.dates) || !input.dates.length || input.dates.length > 100) throw new Error('Ajoutez entre 1 et 100 dates.');
  const seen = new Set();
  const dates = input.dates.map(row => {
    const date = row.date || '';
    const parsed = new Date(`${date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date || date < '2000-01-01' || date > '2100-12-31') throw new Error('Chaque date doit être valide, entre 2000 et 2100.');
    if (seen.has(date)) throw new Error('Chaque journée ne doit apparaître qu’une fois par mission.');
    seen.add(date);
    const start = row.heure_debut?.slice(0,5) || '';
    const end = row.heure_fin?.slice(0,5) || '';
    const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if ((start || end) && (!time.test(start) || !time.test(end) || start >= end)) throw new Error('Renseignez les deux horaires, avec une fin après le début.');
    return { date, heure_debut: start || null, heure_fin: end || null };
  }).sort((a,b) => a.date.localeCompare(b.date));
  const fee = input.fee === '' || input.fee == null ? null : Number(input.fee);
  if (fee != null && (!Number.isFinite(fee) || fee < 0 || fee > 99999999.99 || !feeUnitLabels[input.fee_unit])) throw new Error('Renseignez une rémunération positive ou nulle et son unité.');
  const result = {title, dates, fee, fee_unit: fee == null ? null : input.fee_unit};
  for (const [field,max] of Object.entries({formation:200,client_name:200,site_name:200,address:300,postal_code:20,city:200,private_notes:5000})) {
    result[field] = clean(input[field]);
    if (result[field].length > max) throw new Error(`Le champ ${field} dépasse ${max} caractères.`);
  }
  if (!result.postal_code) throw new Error('Renseignez le code postal du lieu de formation.');
  if (!result.city) throw new Error('Renseignez la ville du lieu de formation.');
  result.location = formatPersonalMissionLocation(result);
  return result;
}

export function personalMissionToAgenda(row) {
  return {...row, origin:'personal', mission_id:row.id, mission_formateur_id:`personal:${row.id}`, mission_title:clean(row.formation) || clean(row.title),
    status:row.status === 'cancelled' ? 'annule' : 'affecte', client_final:clean(row.title), order_giver:clean(row.client_name),
    client:'', organization_id:null, organization_name:'',
    offered_fee:row.fee, mission_notes:row.private_notes, pending_change:null};
}
export function missionHref(row) {
  const id=row.mission_id || row.missionId;
  return row.origin === 'personal' ? `/formateur/missions/personnelles/${id}` : `/formateur/missions/${id}`;
}
export function countUniqueMissions(items) {
  return new Set(items.map(row => `${row.origin || 'organization'}:${row.missionId || row.mission_id}`)).size;
}
export function findMissionConflicts(dates, missions, excludeId) {
  return missions.filter(m => ['accepte','affecte'].includes(m.status) && !(m.origin === 'personal' && m.mission_id === excludeId))
    .flatMap(m => (m.dates || []).filter(d => dates.some(n => n.date === d.date &&
      (!n.heure_debut || !n.heure_fin || !d.heure_debut || !d.heure_fin || (n.heure_debut < d.heure_fin && d.heure_debut < n.heure_fin))))
      .map(d => ({mission:m, date:d.date})));
}
