import { supabase } from '../lib/supabaseClient';

const TABLE = 'trainer_availability';

export async function getAvailabilitiesForMonth({
  trainerIds,
  startDay,
  endDay,
}) {
  if (!Array.isArray(trainerIds) || trainerIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, trainer_id, day, status, note, updated_at')
    .in('trainer_id', trainerIds)
    .gte('day', startDay)
    .lte('day', endDay);

  if (error) {
    throw error;
  }

  return data || [];
}