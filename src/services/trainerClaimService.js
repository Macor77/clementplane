import { supabase } from '../lib/supabaseClient';

export async function getTrainerClaimCandidates() {
  const { data, error } = await supabase.rpc('get_my_trainer_claim_candidates');
  if (error) throw error;
  return data || [];
}

export async function claimTrainerProfile(trainerId) {
  const { data, error } = await supabase.rpc('claim_my_trainer_profile', {
    target_trainer_id: trainerId,
  });

  if (error) throw error;
  return data?.[0] || null;
}

export async function createTrainerProfile({ firstName, lastName, phone, city, postalCode }) {
  const { data, error } = await supabase.rpc('create_my_trainer_profile', {
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone || null,
    p_city: city || null,
    p_postal_code: postalCode || null,
  });

  if (error) throw error;
  return data?.[0] || null;
}
