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
      ville,
      code_postal,
      latitude,
      longitude,
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
    .map((row) => {
      const claimed = Boolean(row.trainer.user_id);

      return {
        ...row.trainer,
        ville: claimed ? row.trainer.ville : row.ville,
        code_postal: claimed
          ? row.trainer.code_postal
          : row.code_postal,
        latitude: claimed
          ? row.trainer.latitude
          : row.latitude,
        longitude: claimed
          ? row.trainer.longitude
          : row.longitude,
        location_source: claimed ? 'trainer' : 'organization',
        claimed,
        organizationTrainerId: row.id,
        organization_id: row.organization_id,
        statut: row.statut ?? 'Standard',
        tarif: row.tarif ?? null,
        notes: row.notes ?? '',
        relation_created_at: row.created_at,
        relation_updated_at: row.updated_at,
      };
    });
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
    .select(`
      id,
      organization_id,
      trainer_id,
      statut,
      tarif,
      notes,
      ville,
      code_postal,
      latitude,
      longitude,
      created_at,
      updated_at
    `)
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
  ville,
  codePostal,
  latitude,
  longitude,
}) {
  if (!organizationId || !trainerId) {
    throw new Error('Organisation et formateur obligatoires.');
  }

  const payload = {
    statut: statut || 'Standard',
    tarif: tarif === '' || tarif == null ? null : Number(tarif),
    notes: notes || null,
  };

  if (ville !== undefined) {
    payload.ville = ville || null;
  }

  if (codePostal !== undefined) {
    payload.code_postal = codePostal || null;
  }

  if (latitude !== undefined) {
    payload.latitude = latitude;
  }

  if (longitude !== undefined) {
    payload.longitude = longitude;
  }

  const { data, error } = await supabase
    .from(ORGANIZATION_TRAINERS_TABLE)
    .update(payload)
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
  statut = 'Standard',
  tarif = null,
  notes = null,
  ville = null,
  codePostal = null,
  latitude = null,
  longitude = null,
}) {
  if (!organizationId || !trainerId) {
    throw new Error('Organisation et formateur obligatoires.');
  }

  const { data, error } = await supabase
    .from(ORGANIZATION_TRAINERS_TABLE)
    .insert({
      organization_id: organizationId,
      trainer_id: trainerId,
      statut: statut || 'Standard',
      tarif: tarif === '' || tarif == null ? null : Number(tarif),
      notes: notes || null,
      ville: ville || null,
      code_postal: codePostal || null,
      latitude,
      longitude,
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


export async function createTrainerForOrganization({
  organizationId,
  prenom,
  nom,
  competences = [],
  materiel = [],
  telephone = null,
  email = null,
  ville = null,
  codePostal = null,
  latitude = null,
  longitude = null,
  statut = 'Standard',
  tarif = null,
  notes = null,
}) {
  if (!organizationId) {
    throw new Error("L'organisation est obligatoire.");
  }

  const { data, error } = await supabase.rpc(
    'create_trainer_for_organization',
    {
      p_organization_id: organizationId,
      p_prenom: prenom || null,
      p_nom: nom || null,
      p_competences: competences || [],
      p_materiel: materiel || [],
      p_telephone: telephone || null,
      p_email: email || null,
      p_ville: ville || null,
      p_code_postal: codePostal || null,
      p_latitude:
        latitude == null
          ? null
          : Number(latitude),
      p_longitude:
        longitude == null
          ? null
          : Number(longitude),
      p_statut: statut || 'Standard',
      p_tarif:
        tarif === '' || tarif == null
          ? null
          : Number(tarif),
      p_notes: notes || null,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


export async function updateUnclaimedTrainerForOrganization({
  organizationId,
  trainerId,
  prenom,
  nom,
  competences = [],
  materiel = [],
  telephone = null,
  email = null,
  ville = null,
  codePostal = null,
  latitude = null,
  longitude = null,
  statut = 'Standard',
  tarif = null,
  notes = null,
}) {
  if (!organizationId || !trainerId) {
    throw new Error('Organisation et formateur obligatoires.');
  }

  const { data, error } = await supabase.rpc(
    'update_unclaimed_trainer_for_organization',
    {
      p_organization_id: organizationId,
      p_trainer_id: trainerId,
      p_prenom: prenom || null,
      p_nom: nom || null,
      p_competences: competences || [],
      p_materiel: materiel || [],
      p_telephone: telephone || null,
      p_email: email || null,
      p_ville: ville || null,
      p_code_postal: codePostal || null,
      p_latitude:
        latitude == null
          ? null
          : Number(latitude),
      p_longitude:
        longitude == null
          ? null
          : Number(longitude),
      p_statut: statut || 'Standard',
      p_tarif:
        tarif === '' || tarif == null
          ? null
          : Number(tarif),
      p_notes: notes || null,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}
