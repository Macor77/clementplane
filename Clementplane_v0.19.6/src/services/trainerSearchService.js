import { supabase } from '../lib/supabaseClient';


export async function searchGlobalTrainers({
  organizationId,
  query,
}) {
  const normalizedQuery =
    String(query || '').trim();

  if (!organizationId) {
    throw new Error(
      "L'organisation est obligatoire.",
    );
  }

  if (normalizedQuery.length < 2) {
    return [];
  }

  const { data, error } =
    await supabase.rpc(
      'search_trainers_for_organization',
      {
        p_organization_id:
          organizationId,

        p_query:
          normalizedQuery,
      },
    );

  if (error) {
    throw error;
  }

  return data || [];
}


export async function addTrainerToOrganization({
  organizationId,
  trainerId,
}) {
  if (
    !organizationId ||
    !trainerId
  ) {
    throw new Error(
      'Organisation et formateur obligatoires.',
    );
  }

  const { data, error } =
    await supabase.rpc(
      'add_trainer_to_my_organization',
      {
        p_organization_id:
          organizationId,

        p_trainer_id:
          trainerId,
      },
    );

  if (error) {
    throw error;
  }

  return data;
}
