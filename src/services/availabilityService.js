import { supabase } from '../lib/supabaseClient';

export async function getAvailabilitiesForMonth({
  organizationId,
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

  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase.rpc(
    'get_organization_trainer_availability',
    {
      p_organization_id: organizationId,
      p_trainer_ids: trainerIds,
      p_start_day: startDay,
      p_end_day: endDay,
    },
  );

  if (error) {
    throw error;
  }

  return data || [];
}


/* =========================================================
   NOTES — ESPACE OF
   ========================================================= */


export async function getOrganizationAvailabilityNotes({
  organizationId,
  trainerIds,
  startDay,
  endDay,
}) {
  if (
    !organizationId ||
    !Array.isArray(trainerIds) ||
    trainerIds.length === 0
  ) {
    return [];
  }

  const { data, error } = await supabase.rpc(
    'get_organization_availability_notes',
    {
      p_organization_id: organizationId,
      p_trainer_ids: trainerIds,
      p_start_day: startDay,
      p_end_day: endDay,
    },
  );

  if (error) {
    throw error;
  }

  return data || [];
}


export async function createOrganizationAvailabilityNote({
  organizationId,
  trainerId,
  day,
  content,
}) {
  const { data, error } = await supabase.rpc(
    'create_organization_availability_note',
    {
      p_organization_id: organizationId,
      p_trainer_id: trainerId,
      p_day: day,
      p_content: content,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


export async function updateOrganizationAvailabilityNote({
  organizationId,
  noteId,
  content,
}) {
  const { data, error } = await supabase.rpc(
    'update_organization_availability_note',
    {
      p_organization_id: organizationId,
      p_note_id: noteId,
      p_content: content,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


export async function deleteOrganizationAvailabilityNote({
  organizationId,
  noteId,
}) {
  const { data, error } = await supabase.rpc(
    'delete_organization_availability_note',
    {
      p_organization_id: organizationId,
      p_note_id: noteId,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
   ÉCRITURE DISPONIBILITÉ — ESPACE OF
   ========================================================= */


export async function setOrganizationTrainerAvailability({
  organizationId,
  trainerId,
  day,
  status,
}) {
  if (!organizationId) {
    throw new Error(
      "L'organisme est obligatoire.",
    );
  }

  if (!trainerId) {
    throw new Error(
      'Le formateur est obligatoire.',
    );
  }

  if (!day) {
    throw new Error(
      'La date est obligatoire.',
    );
  }

  const { data, error } = await supabase.rpc(
    'set_organization_trainer_availability',
    {
      p_organization_id: organizationId,
      p_trainer_id: trainerId,
      p_day: day,
      p_status: status || '',
    },
  );

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}


/* =========================================================
   HISTORIQUE — ESPACE OF
   ========================================================= */


export async function getOrganizationAvailabilityHistory({
  organizationId,
  trainerIds,
  startDay,
  endDay,
}) {
  if (
    !organizationId ||
    !Array.isArray(trainerIds) ||
    trainerIds.length === 0
  ) {
    return [];
  }

  const { data, error } = await supabase.rpc(
    'get_organization_availability_history',
    {
      p_organization_id: organizationId,
      p_trainer_ids: trainerIds,
      p_start_day: startDay,
      p_end_day: endDay,
    },
  );

  if (error) {
    throw error;
  }

  return data || [];
}