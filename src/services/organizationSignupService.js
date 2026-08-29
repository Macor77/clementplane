import { supabase } from '../lib/supabaseClient';
import { LEGAL_VERSIONS } from '../constants/legal';


export async function signUpOrganization({
  email,
  password,
  firstName,
  lastName,
  organizationName,
  emailRedirectTo = null,
  legalAccepted,
}) {
  if (!legalAccepted) throw new Error('LEGAL_ACCEPTANCE_REQUIRED');
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

          terms_accepted:
            true,

          terms_version:
            LEGAL_VERSIONS.cgu,

          privacy_acknowledged:
            true,

          privacy_version:
            LEGAL_VERSIONS.privacy,

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
