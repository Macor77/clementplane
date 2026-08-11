import { supabase } from '../lib/supabaseClient';

const TRAINERS_TABLE = 'trainers';
const ORGANIZATION_TRAINERS_TABLE = 'organization_trainers';


export async function getFormateurs(organizationId) {
  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from(ORGANIZATION_TRAINERS_TABLE)
    .select(`
      id,
      organization_id,
      trainer_id,
      statut,
      tarif,
      notes,
      created_at,
      updated_at,
      trainer:trainers (
        id,
        prenom,
        nom,
        ville,
        code_postal,
        competences,
        materiel,
        telephone,
        email,
        adresse,
        latitude,
        longitude,
        user_id,
        created_at
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((row) => row.trainer)
    .map((row) => ({
      ...row.trainer,
      organizationTrainerId: row.id,
      organization_id: row.organization_id,
      statut: row.statut ?? 'Inactif',
      tarif: row.tarif ?? null,
      notes: row.notes ?? '',
      relation_created_at: row.created_at,
      relation_updated_at: row.updated_at,
    }));
}


export async function removeFormateurFromOrganization(
  organizationId,
  trainerId,
) {
  if (!organizationId) {
    throw new Error("L'organisation est obligatoire.");
  }

  if (!trainerId) {
    throw new Error("L'identifiant du formateur est obligatoire.");
  }

  const { error } = await supabase
    .from(ORGANIZATION_TRAINERS_TABLE)
    .delete()
    .eq('organization_id', organizationId)
    .eq('trainer_id', trainerId);

  if (error) {
    throw error;
  }
}


export async function getOrganizationTrainerRelation({
  organizationId,
  trainerId,
}) {
  if (!organizationId || !trainerId) {
    return null;
  }

  const { data, error } = await supabase
    .from(ORGANIZATION_TRAINERS_TABLE)
    .select('id, organization_id, trainer_id, statut, tarif, notes, created_at, updated_at')
    .eq('organization_id', organizationId)
    .eq('trainer_id', trainerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}


export async function updateOrganizationTrainerRelation({
  organizationId,
  trainerId,
  statut,
  tarif,
  notes,
}) {
  if (!organizationId || !trainerId) {
    throw new Error('Organisation et formateur obligatoires.');
  }

  const { data, error } = await supabase
    .from(ORGANIZATION_TRAINERS_TABLE)
    .update({
      statut: statut || 'Inactif',
      tarif: tarif === '' || tarif == null ? null : Number(tarif),
      notes: notes || null,
    })
    .eq('organization_id', organizationId)
    .eq('trainer_id', trainerId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function createOrganizationTrainerRelation({
  organizationId,
  trainerId,
  statut = 'Inactif',
  tarif = null,
  notes = null,
}) {
  if (!organizationId || !trainerId) {
    throw new Error('Organisation et formateur obligatoires.');
  }

  const { data, error } = await supabase
    .from(ORGANIZATION_TRAINERS_TABLE)
    .insert({
      organization_id: organizationId,
      trainer_id: trainerId,
      statut: statut || 'Inactif',
      tarif: tarif === '' || tarif == null ? null : Number(tarif),
      notes: notes || null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function updateFormateurGps(
  id,
  latitude,
  longitude,
) {
  const { error } = await supabase
    .from(TRAINERS_TABLE)
    .update({
      latitude,
      longitude,
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
