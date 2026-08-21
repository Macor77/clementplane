import { supabase } from '../lib/supabaseClient';

const PROFILE_VALUES = new Set(['organization', 'trainer', 'other']);

export async function submitPublicContact({
  firstName,
  lastName,
  email,
  profile,
  message,
  website = '',
  startedAt,
}) {
  const payload = {
    firstName: String(firstName || '').trim(),
    lastName: String(lastName || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    profile: PROFILE_VALUES.has(profile) ? profile : 'other',
    message: String(message || '').trim(),
    website: String(website || '').trim(),
    startedAt: Number(startedAt || Date.now()),
  };

  if (!payload.firstName || !payload.lastName) {
    throw new Error('Votre prénom et votre nom sont obligatoires.');
  }

  if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) {
    throw new Error('Veuillez renseigner une adresse e-mail valide.');
  }

  if (!payload.message) {
    throw new Error('Votre message est obligatoire.');
  }

  if (payload.message.length > 5000) {
    throw new Error('Votre message est trop long (5 000 caractères maximum).');
  }

  const { data, error } = await supabase.functions.invoke(
    'submit-public-contact',
    { body: payload },
  );

  if (error || !data?.success) {
    const message =
      data?.message ||
      error?.message ||
      "Impossible d'envoyer votre message pour le moment.";

    throw new Error(message);
  }

  return data;
}
