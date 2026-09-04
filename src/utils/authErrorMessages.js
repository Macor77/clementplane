export function getSignupErrorMessage(error, fallback = "Impossible de créer le compte pour le moment. Réessayez dans quelques instants.") {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();

  if (message.includes('already registered') || code === 'user_already_exists') {
    return 'Un compte existe déjà avec cette adresse e-mail.';
  }

  if (
    message.includes('known to be weak and easy to guess') ||
    message.includes('password is known') ||
    code === 'weak_password'
  ) {
    return 'Ce mot de passe ne peut pas être utilisé car il est trop courant ou a été compromis. Choisissez un autre mot de passe.';
  }

  if (message.includes('rate limit') || code.includes('rate_limit') || error?.status === 429) {
    return 'Trop de tentatives ont été effectuées. Patientez quelques minutes avant de réessayer.';
  }

  if (message.includes('password') && (message.includes('least') || message.includes('characters'))) {
    return 'Le mot de passe ne respecte pas les critères de sécurité. Choisissez un mot de passe plus robuste.';
  }

  return fallback;
}
