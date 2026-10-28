import { supabase } from '../lib/supabaseClient';

// Microsoft calendar is intentionally opt-in. Never activate the UI before
// the server-side OAuth callback, token storage and worker are deployed.
export const microsoftCalendarEnabled =
  import.meta.env.VITE_MICROSOFT_CALENDAR_ENABLED === 'true';

const messages = {
  NOT_AVAILABLE: 'La synchronisation Outlook n’est pas encore disponible pour ce compte.',
  INVALID_OAUTH_STATE: 'Cette connexion Microsoft a expiré. Recommencez depuis les paramètres.',
  MICROSOFT_CONSENT_REQUIRED: 'Autorisez l’accès au calendrier Clementplane dans Microsoft.',
  MICROSOFT_RECONNECT_REQUIRED: 'Reconnectez votre compte Microsoft pour reprendre la synchronisation.',
  MICROSOFT_ACCOUNT_ALREADY_LINKED: 'Ce compte Microsoft est déjà associé à un autre compte Clementplane.',
  WRONG_MICROSOFT_ACCOUNT: 'Reconnectez le même compte Microsoft que précédemment.',
  CALENDAR_CREATION_UNCERTAIN: 'La création du calendrier doit être vérifiée avant une nouvelle tentative. Contactez le support.',
  MISSING_CALENDAR_SCOPE: 'Microsoft n’a pas accordé l’accès au calendrier. Recommencez la connexion.',
  ALREADY_CONNECTED: 'Ce compte est déjà connecté.',
  SYNC_BUSY: 'Une synchronisation est déjà en cours. Réessayez dans quelques instants.',
};

export async function microsoftCalendarAction(action, values = {}) {
  if (!microsoftCalendarEnabled) {
    throw new Error(messages.NOT_AVAILABLE);
  }
  const { data, error } = await supabase.functions.invoke('microsoft-calendar', {
    body: { action, ...values },
  });
  if (error || data?.error) {
    let code = data?.error;
    try {
      if (!code && error?.context) code = (await error.context.json()).error;
    } catch { /* Fall back to a safe generic error. */ }
    throw new Error(messages[code] || 'Impossible de joindre la synchronisation Outlook. Réessayez plus tard.');
  }
  return data;
}
