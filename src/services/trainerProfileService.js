import { supabase } from '../lib/supabaseClient';

export async function getMyTrainerProfile() {
  const { data, error } = await supabase.rpc(
    'get_my_trainer_profile',
  );

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function updateMyTrainerProfile({
  firstName,
  lastName,
  phone,
  address,
  city,
  postalCode,
  skills,
  equipment,
}) {
  const { data, error } = await supabase.rpc(
    'update_my_trainer_profile',
    {
      p_first_name: firstName,
      p_last_name: lastName,
      p_phone: phone || null,
      p_address: address || null,
      p_city: city || null,
      p_postal_code: postalCode || null,
      p_skills: skills || [],
      p_equipment: equipment || [],
    },
  );

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}