import { supabase } from '../lib/supabaseClient';


export async function signUpOrganization({
  email,
  password,
  firstName,
  lastName,
  organizationName,
  emailRedirectTo = null,
}) {
  const { data, error } =
    await supabase.auth.signUp({
      email:
        email.trim(),

      password,

      options: {
        data: {
          first_name:
            firstName.trim(),

          last_name:
            lastName.trim(),

          signup_intent:
            'organization',

          organization_name:
            organizationName.trim(),
        },

        ...(emailRedirectTo
          ? { emailRedirectTo }
          : {}),
      },
    });

  if (error) {
    throw error;
  }

  return data;
}
