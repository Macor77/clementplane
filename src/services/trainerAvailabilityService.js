import { supabase } from '../lib/supabaseClient';


export async function getMyTrainerAvailability({
  startDay,
  endDay,
}) {
  const { data, error } = await supabase.rpc(
    'get_my_trainer_availability',
    {
      p_start_day: startDay,
      p_end_day: endDay,
    },
  );

  if (error) {
    throw error;
  }

  return data || [];
}


export async function setMyTrainerAvailability({
  day,
  status,
}) {
  const { data, error } = await supabase.rpc(
    'set_my_trainer_availability',
    {
      p_day: day,
      p_status: status || '',
      p_note: '',
    },
  );

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}


/* =========================================================
   OPTIONS / MISSIONS DU FORMATEUR
   ========================================================= */


export async function getMyTrainerCommitments({
  startDay,
  endDay,
}) {
  const { data, error } = await supabase.rpc(
    'get_my_trainer_commitments_with_mission',
    {
      p_start_day: startDay,
      p_end_day: endDay,
    },
  );

  if (error) {
    throw error;
  }

  return data || [];
}


/**
 * Retourne uniquement les informations de mission
 * autorisées au formateur connecté.
 */
export async function getMyTrainerMission(
  missionId,
) {
  if (!missionId) {
    throw new Error(
      "L'identifiant de la mission est obligatoire.",
    );
  }


  const { data, error } = await supabase.rpc(
    'get_my_trainer_mission',
    {
      p_mission_id:
        missionId,
    },
  );


  if (error) {
    throw error;
  }


  return data?.[0] || null;
}


/* =========================================================
   NOTES DU FORMATEUR
   ========================================================= */


export async function getMyAvailabilityNotes({
  startDay,
  endDay,
}) {
  const { data, error } = await supabase.rpc(
    'get_my_availability_notes',
    {
      p_start_day: startDay,
      p_end_day: endDay,
    },
  );

  if (error) {
    throw error;
  }

  return data || [];
}


export async function createMyAvailabilityNote({
  day,
  content,
}) {
  const { data, error } = await supabase.rpc(
    'create_my_availability_note',
    {
      p_day: day,
      p_content: content,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


export async function updateMyAvailabilityNote({
  noteId,
  content,
}) {
  const { data, error } = await supabase.rpc(
    'update_my_availability_note',
    {
      p_note_id: noteId,
      p_content: content,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


export async function deleteMyAvailabilityNote(
  noteId,
) {
  const { data, error } = await supabase.rpc(
    'delete_my_availability_note',
    {
      p_note_id: noteId,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
   HISTORIQUE DES DISPONIBILITÉS
   ========================================================= */


export async function getMyAvailabilityHistory({
  startDay,
  endDay,
}) {
  const { data, error } = await supabase.rpc(
    'get_my_availability_history',
    {
      p_start_day: startDay,
      p_end_day: endDay,
    },
  );

  if (error) {
    throw error;
  }

  return data || [];
}