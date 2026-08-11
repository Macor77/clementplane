import { supabase } from '../lib/supabaseClient';

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpTrainer({ email, password, firstName, lastName }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        signup_intent: 'trainer',
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

export async function signOutCurrentUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
