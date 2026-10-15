import { supabase } from '../lib/supabaseClient';

const sessionRequired = () => Object.assign(new Error('Votre session a expiré. Reconnectez-vous pour continuer.'), { code: 'SESSION_REQUIRED' });
let refreshing;
async function refresh() {
  if (!refreshing) {
    refreshing = supabase.auth.refreshSession().then(({ data, error }) => {
      if (error) {
        if (error.status === 0 || error.status >= 500 || error.name === 'AuthRetryableFetchError') throw error;
        throw sessionRequired();
      }
      if (!data?.session) throw sessionRequired();
      return data.session;
    }).finally(() => { refreshing = undefined; });
  }
  return refreshing;
}

export async function availabilityRpc(name, args) {
  if (globalThis.navigator?.onLine === false) throw new Error('Connexion réseau interrompue.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data?.session) throw sessionRequired();
  if (data.session.expires_at * 1000 <= Date.now() + 30000) await refresh();
  let result = await supabase.rpc(name, args);
  // A 401 is a rejected request, unlike a network failure with an unknown write outcome.
  if (result.status === 401) {
    const renewed = await refresh();
    if (renewed.user?.id !== data.session.user?.id) throw sessionRequired();
    result = await supabase.rpc(name, args);
    if (result.status === 401) throw sessionRequired();
  }
  return result;
}

export function availabilityErrorMessage(error, saving = false) {
  if (error?.code === 'SESSION_REQUIRED') return error.message;
  const message = String(error?.message || '');
  if (globalThis.navigator?.onLine === false || /fetch|network|réseau|Load failed|timeout/i.test(message)) {
    return saving
      ? 'Connexion interrompue : enregistrement non confirmé. Réessayez de charger les disponibilités pour vérifier le résultat.'
      : 'Connexion interrompue : vos disponibilités ne peuvent pas être chargées. Réessayez lorsque le réseau est disponible.';
  }
  return saving
    ? 'Enregistrement non confirmé. Rechargez les disponibilités pour vérifier le résultat avant de réessayer.'
    : 'Impossible de charger vos disponibilités. Réessayez dans un instant.';
}
