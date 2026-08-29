import { supabase } from '../lib/supabaseClient';
import { LEGAL_VERSIONS } from '../constants/legal';

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpTrainer({ email, password, firstName, lastName, legalAccepted }) {
  if (!legalAccepted) throw new Error('LEGAL_ACCEPTANCE_REQUIRED');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        signup_intent: 'trainer',
        terms_accepted: true,
        terms_version: LEGAL_VERSIONS.cgu,
        privacy_acknowledged: true,
        privacy_version: LEGAL_VERSIONS.privacy,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function requestPasswordReset(email) {
  const redirectTo = `${window.location.origin}/reinitialiser-mot-de-passe`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  );

  if (error) throw error;
  return data;
}

export async function updateCurrentUserPassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function requestCurrentUserEmailChange(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Veuillez saisir une adresse e-mail.');
  }

  const { data, error } = await supabase.auth.updateUser(
    { email: normalizedEmail },
    {
      emailRedirectTo: `${window.location.origin}/parametres`,
    },
  );

  if (error) throw error;
  return data;
}

export async function signOutCurrentUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
