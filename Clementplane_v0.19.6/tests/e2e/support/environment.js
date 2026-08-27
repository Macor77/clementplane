const PROD_REF = 'hctvkynrgmnxjynbncdi';

function extractProjectRef(url) {
  const match = String(url || '').match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  return match?.[1] || '';
}

export function assertSafeE2EEnvironment({ url, allowReset, expectedProjectRef }) {
  if (!url) throw new Error('E2E_SUPABASE_URL manquante');
  const projectRef = extractProjectRef(url);
  if (!projectRef) throw new Error('E2E_SUPABASE_URL invalide');
  if (projectRef === PROD_REF) throw new Error('Refus: projet Supabase de production détecté');
  if (allowReset !== 'true') throw new Error('E2E_ALLOW_RESET=true est requis');
  if (!expectedProjectRef) throw new Error('E2E_PROJECT_REF manquante');
  if (expectedProjectRef === PROD_REF) throw new Error('Refus: E2E_PROJECT_REF pointe vers la production');
  if (projectRef !== expectedProjectRef) throw new Error('Refus: URL Supabase différente du projet E2E attendu');
  return { projectRef };
}
