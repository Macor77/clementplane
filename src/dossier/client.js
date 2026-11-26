export const enabled = import.meta.env.VITE_DOSSIER_ENABLED === 'true';
const endpoint = import.meta.env.VITE_DOSSIER_API;
export const kinds = {
  cv: 'CV',
  nda: 'Justificatif de déclaration d’activité — NDA',
  sirene: 'Avis de situation Sirene',
  rc: 'Attestation RC professionnelle',
  urssaf: 'Attestation de vigilance URSSAF',
  habilitation: 'Certification ou habilitation de formateur',
  diplome: 'Diplôme',
  qualiopi: 'Certificat Qualiopi',
  autre: 'Autre document',
};
export function day(offset = 0) {
  const now = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris',
  }).format(new Date());
  const date = new Date(now + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function fmt(value) {
  return value ? value.slice(0, 10).split('-').reverse().join('/') : '';
}
export function expiry(doc) {
  if (doc.expiry_mode === 'none') return 'Sans expiration déclarée';
  if (!doc.expiry) return 'Échéance à renseigner';
  const status =
    doc.expiry < day()
      ? 'Expiré'
      : doc.expiry <= day(30)
        ? 'Expiration prochaine'
        : 'Échéance';
  return status + ' · ' + fmt(doc.expiry);
}
export class UploadUnconfirmedError extends Error {
  constructor(reason) {
    super(reason + ' Réessayez le même dépôt ou revenez au dossier pour vérifier.');
  }
}

export async function call(action, data = {}, guest = false) {
  if (!enabled || !endpoint) throw Error('Dossier indisponible.');
  const url = new URL(endpoint);
  if (
    url.protocol !== 'https:' &&
    !['127.0.0.1', 'localhost'].includes(url.hostname)
  )
    throw Error('Service indisponible.');
  const headers = { 'Content-Type': 'application/json' };
  if (!guest) {
    const { supabase } = await import('../lib/supabaseClient');
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw Error('Reconnectez-vous à Clementplane.');
    headers.Authorization = 'Bearer ' + session.access_token;
  }
  let res;
  try {
    res = await fetch(url.origin + '/v1/' + action, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      headers,
      body: JSON.stringify(data),
    });
  } catch {
    if (action === 'upload')
      throw new UploadUnconfirmedError('Connexion interrompue avant la confirmation.');
    throw Error(
      'Connexion interrompue. Réessayez en gardant cette page ouverte.',
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (action === 'upload' && (res.status === 408 || res.status >= 500))
      throw new UploadUnconfirmedError('Le serveur n’a pas confirmé l’enregistrement.');
    throw Error(
      typeof body?.detail === 'string' && body.detail.length > 12
        ? body.detail
        : res.status === 429
          ? 'Trop de demandes. Réessayez ultérieurement.'
          : 'Accès indisponible ou expiré.',
    );
  }
  if (action === 'upload') {
    const receipt = await res.json().catch(() => null);
    if (!receipt?.id || receipt.id !== data.doc)
      throw new UploadUnconfirmedError('La confirmation du dépôt est incomplète.');
    return receipt;
  }
  return ['file', 'guest-file'].includes(action)
    ? {
        blob: await res.blob(),
        pages: Number(res.headers.get('X-Document-Pages')) || 1,
      }
    : res.json();
}
export function encodeFile(file) {
  if (!file || !file.size || file.size > 5 * 1024 * 1024)
    throw Error('Choisissez un PDF, JPEG ou PNG de 5 Mio maximum.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () =>
      reject(Error('Fichier illisible. Sélectionnez-le à nouveau.'));
    reader.readAsDataURL(file);
  });
}
