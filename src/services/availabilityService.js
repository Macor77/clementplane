import { supabase } from '../lib/supabaseClient';

const TABLE = 'trainer_availability';

/**
 * Retourne uniquement les disponibilités déclarées par les formateurs.
 *
 * Les états "option" et "mission" ne sont pas enregistrés dans cette
 * table : ils sont déduits des missions afin d'éviter les doublons et
 * les incohérences.
 */
export async function getAvailabilitiesForMonth({
  trainerIds,
  startDay,
  endDay,
}) {
  if (
    !Array.isArray(trainerIds) ||
    trainerIds.length === 0
  ) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id, trainer_id, day, status, note, updated_at',
    )
    .in('trainer_id', trainerIds)
    .gte('day', startDay)
    .lte('day', endDay);

  if (error) {
    throw error;
  }

  return data || [];
}
