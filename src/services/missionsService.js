import { supabase } from '../lib/supabaseClient';

const MISSIONS_TABLE = 'missions';
const MISSION_DATES_TABLE = 'mission_dates';
const MISSION_FORMATEURS_TABLE =
  'mission_formateurs';

const MISSION_FORMATEUR_STATUSES = [
  'selectionne',
  'proposition_envoyee',
  'accepte',
  'refuse',
  'affecte',
  'indisponible_affecte_ailleurs',
  'annule',
  'desiste',
  'mission_pourvue',
];

/**
 * Retourne toutes les missions avec leurs dates
 * et les formateurs associés.
 */
export async function getMissions() {
  const { data, error } = await supabase
    .from(MISSIONS_TABLE)
    .select(`
      *,
      mission_dates (
        id,
        date,
        heure_debut,
        heure_fin,
        created_at
      ),
      mission_formateurs (
        id,
        formateur_id,
        statut,
        propose_le,
        repondu_le,
        affecte_le,
        commentaire,
        proposal_token,
        proposal_expires_at,
        proposal_viewed_at,
        response_comment,
        created_at,
        trainer:trainers (
          id,
          prenom,
          nom,
          email,
          telephone,
          ville,
          code_postal,
          latitude,
          longitude,
          competences,
          materiel
        )
      )
    `)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(
    sortMissionDates,
  );
}

/**
 * Retourne une mission complète à partir de son identifiant.
 */

/**
 * Retourne l'historique des actions réalisées sur les formateurs
 * d'une mission.
 *
 * L'historique est alimenté côté base par un trigger afin de tracer
 * aussi bien les actions OF que les réponses réalisées par le formateur.
 */
export async function getMissionTrainerHistory(
  missionId,
) {
  if (!missionId) {
    throw new Error(
      "L'identifiant de la mission est obligatoire.",
    );
  }

  const { data, error } = await supabase
    .from('mission_trainer_history')
    .select(`
      id,
      mission_id,
      trainer_id,
      mission_formateur_id,
      action,
      previous_status,
      new_status,
      actor_user_id,
      actor_type,
      actor_display_name,
      actor_organization_id,
      actor_organization_name,
      details,
      created_at,
      trainer:trainers (
        id,
        prenom,
        nom
      )
    `)
    .eq('mission_id', missionId)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getMissionById(id) {
  if (!id) {
    throw new Error(
      "L'identifiant de la mission est obligatoire.",
    );
  }

  const { data, error } = await supabase
    .from(MISSIONS_TABLE)
    .select(`
      *,
      mission_dates (
        id,
        date,
        heure_debut,
        heure_fin,
        created_at
      ),
      mission_formateurs (
        id,
        formateur_id,
        statut,
        propose_le,
        repondu_le,
        affecte_le,
        commentaire,
        proposal_token,
        proposal_expires_at,
        proposal_viewed_at,
        response_comment,
        created_at,
        trainer:trainers (
          id,
          prenom,
          nom,
          email,
          telephone,
          ville,
          code_postal,
          latitude,
          longitude,
          competences,
          materiel
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return sortMissionDates(data);
}

/**
 * Retourne les engagements issus des missions pour une liste de
 * formateurs et une période.
 *
 * Cette fonction ne révèle que les statuts et les dates nécessaires
 * au calcul de disponibilité. Elle n'expose ni le client, ni l'OF,
 * ni le contenu d'une autre mission.
 */
export async function getTrainerMissionCommitments({
  trainerIds,
  startDay,
  endDay,
  excludeMissionId = null,
  organizationId = null,
}) {
  if (
    !Array.isArray(trainerIds) ||
    trainerIds.length === 0 ||
    !startDay ||
    !endDay ||
    !organizationId
  ) {
    return [];
  }

  /*
   * Cette RPC SECURITY DEFINER vérifie les conflits
   * à travers tous les OF sans révéler le client,
   * le lieu, l'organisme ou le contenu de la mission.
   */
  const { data, error } = await supabase.rpc(
    'get_trainer_mission_commitments_safe',
    {
      p_trainer_ids:
        trainerIds,
      p_start_day:
        startDay,
      p_end_day:
        endDay,
      p_exclude_mission_id:
        excludeMissionId,

      p_organization_id:
        organizationId,
    },
  );

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Crée une mission et ses différentes journées.
 */
export async function createMission({
  mission,
  dates = [],
  organizationId = null,
}) {
  validateMission(mission, dates);

  const resolvedOrganizationId =
    await resolveMissionOrganizationId(
      organizationId,
    );

  const missionPayload = {
    ...cleanMissionPayload(mission),
    organization_id:
      resolvedOrganizationId,
  };

  const {
    data: createdMission,
    error: missionError,
  } = await supabase
    .from(MISSIONS_TABLE)
    .insert(missionPayload)
    .select('*')
    .single();

  if (missionError) {
    throw missionError;
  }

  try {
    const createdDates =
      await insertMissionDates(
        createdMission.id,
        dates,
      );

    return {
      ...createdMission,
      mission_dates: createdDates,
      mission_formateurs: [],
    };
  } catch (error) {
    await supabase
      .from(MISSIONS_TABLE)
      .delete()
      .eq('id', createdMission.id);

    throw error;
  }
}

/**
 * Modifie une mission et remplace ses dates.
 */
export async function updateMission(
  id,
  {
    mission,
    dates = [],
  },
) {
  if (!id) {
    throw new Error(
      "L'identifiant de la mission est obligatoire.",
    );
  }

  validateMission(mission, dates);

  const trainerIds =
    await getMissionTrainerIds(id);

  const missionPayload =
    cleanMissionPayload(mission);

  const {
    data: updatedMission,
    error: missionError,
  } = await supabase
    .from(MISSIONS_TABLE)
    .update(missionPayload)
    .eq('id', id)
    .select('*')
    .single();

  if (missionError) {
    throw missionError;
  }

  const { error: deleteDatesError } =
    await supabase
      .from(MISSION_DATES_TABLE)
      .delete()
      .eq('mission_id', id);

  if (deleteDatesError) {
    throw deleteDatesError;
  }

  const updatedDates =
    await insertMissionDates(id, dates);

  await reconcileTrainerConflicts(
    trainerIds,
  );

  return {
    ...updatedMission,
    mission_dates: updatedDates,
  };
}

/**
 * Supprime une mission.
 *
 * Les dates et associations sont supprimées grâce au CASCADE.
 * Les anciennes options rendues indisponibles par cette mission sont
 * ensuite recalculées.
 */
export async function deleteMission(id) {
  if (!id) {
    throw new Error(
      "L'identifiant de la mission est obligatoire.",
    );
  }

  const trainerIds =
    await getMissionTrainerIds(id);

  const { error } = await supabase
    .from(MISSIONS_TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  await reconcileTrainerConflicts(
    trainerIds,
  );
}

/**
 * Duplique une mission.
 *
 * Les dates sont conservées.
 * Les formateurs associés ne sont pas recopiés.
 */
export async function duplicateMission(id) {
  const sourceMission =
    await getMissionById(id);

  const duplicatedMission = {
    code_interne:
      sourceMission.code_interne
        ? `${sourceMission.code_interne}-COPIE`
        : null,

    client: sourceMission.client,
    intitule: sourceMission.intitule,
    formation: sourceMission.formation,
    lieu: sourceMission.lieu,
    adresse: sourceMission.adresse,
    code_postal:
      sourceMission.code_postal,
    ville: sourceMission.ville,
    latitude: sourceMission.latitude,
    longitude: sourceMission.longitude,
    competences:
      sourceMission.competences,
    materiel: sourceMission.materiel,
    prix_vente:
      sourceMission.prix_vente,
    cout_formateur:
      sourceMission.cout_formateur,
    commentaire:
      sourceMission.commentaire,
    statut: 'brouillon',
  };

  const duplicatedDates = (
    sourceMission.mission_dates || []
  ).map((missionDate) => ({
    date: missionDate.date,
    heure_debut:
      missionDate.heure_debut,
    heure_fin: missionDate.heure_fin,
  }));

  return createMission({
    mission: duplicatedMission,
    dates: duplicatedDates,
    organizationId:
      sourceMission.organization_id,
  });
}

/**
 * Lie un formateur à une mission avec le statut "sélectionné".
 */
export async function selectFormateurForMission(
  missionId,
  formateurId,
) {
  if (!missionId || !formateurId) {
    throw new Error(
      'La mission et le formateur sont obligatoires.',
    );
  }

  const { data, error } = await supabase
    .from(MISSION_FORMATEURS_TABLE)
    .insert({
      mission_id: missionId,
      formateur_id: formateurId,
      statut: 'selectionne',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Retire un formateur d'une mission.
 */
export async function removeFormateurFromMission(
  missionId,
  formateurId,
) {
  if (!missionId || !formateurId) {
    throw new Error(
      'La mission et le formateur sont obligatoires.',
    );
  }

  const { error } = await supabase
    .from(MISSION_FORMATEURS_TABLE)
    .delete()
    .eq('mission_id', missionId)
    .eq('formateur_id', formateurId);

  if (error) {
    throw error;
  }

  await syncMissionStatusWithAffectation(
    missionId,
  );

  await reconcileTrainerConflicts([
    formateurId,
  ]);
}

/**
 * Modifie le statut d'un formateur pour une mission.
 */
export async function updateMissionFormateurStatus(
  missionId,
  formateurId,
  statut,
) {
  if (
    !missionId ||
    !formateurId ||
    !statut
  ) {
    throw new Error(
      'La mission, le formateur et le statut sont obligatoires.',
    );
  }

  if (
    !MISSION_FORMATEUR_STATUSES.includes(
      statut,
    )
  ) {
    throw new Error(
      `Statut de formateur non reconnu : ${statut}`,
    );
  }

  if (
    statut ===
    'indisponible_affecte_ailleurs'
  ) {
    throw new Error(
      'Ce statut est géré automatiquement.',
    );
  }

  const now = new Date().toISOString();

  if (statut === 'affecte') {
    await assertTrainerCanBeAffected({
      missionId,
      formateurId,
    });

    const {
      data: previousAffectedRows,
      error: previousAffectedError,
    } = await supabase
      .from(MISSION_FORMATEURS_TABLE)
      .select('formateur_id')
      .eq('mission_id', missionId)
      .eq('statut', 'affecte')
      .neq(
        'formateur_id',
        formateurId,
      );

    if (previousAffectedError) {
      throw previousAffectedError;
    }

    const previousTrainerIds = (
      previousAffectedRows || []
    ).map(
      (row) => row.formateur_id,
    );

    const {
      error: resetPreviousError,
    } = await supabase
      .from(MISSION_FORMATEURS_TABLE)
      .update({
        statut: 'accepte',
        affecte_le: null,
      })
      .eq('mission_id', missionId)
      .eq('statut', 'affecte')
      .neq(
        'formateur_id',
        formateurId,
      );

    if (resetPreviousError) {
      throw resetPreviousError;
    }

    /*
     * Une mission ne peut être affectée qu'à un seul formateur.
     * Dès qu'un formateur est confirmé, les autres propositions/options
     * encore actives sur CETTE mission sont clôturées comme "mission pourvue".
     */
    const { error: closeOtherOptionsError } =
      await supabase
        .from(MISSION_FORMATEURS_TABLE)
        .update({
          statut: 'mission_pourvue',
          affecte_le: null,
        })
        .eq('mission_id', missionId)
        .neq('formateur_id', formateurId)
        .in('statut', [
          'selectionne',
          'proposition_envoyee',
          'accepte',
        ]);

    if (closeOtherOptionsError) {
      throw closeOtherOptionsError;
    }

    await reconcileTrainerConflicts(
      previousTrainerIds,
    );
  }

  const statusPayload =
    buildMissionFormateurStatusPayload(
      statut,
      now,
    );

  const { data, error } = await supabase
    .from(MISSION_FORMATEURS_TABLE)
    .update(statusPayload)
    .eq('mission_id', missionId)
    .eq('formateur_id', formateurId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await syncMissionStatusWithAffectation(
    missionId,
  );

  await reconcileTrainerConflicts([
    formateurId,
  ]);

  return data;
}

/**
 * Met à jour le commentaire associé à un formateur.
 */
export async function updateMissionFormateurComment(
  missionId,
  formateurId,
  commentaire,
) {
  if (!missionId || !formateurId) {
    throw new Error(
      'La mission et le formateur sont obligatoires.',
    );
  }

  const { data, error } = await supabase
    .from(MISSION_FORMATEURS_TABLE)
    .update({
      commentaire:
        commentaire?.trim() || null,
    })
    .eq('mission_id', missionId)
    .eq('formateur_id', formateurId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function buildMissionFormateurStatusPayload(
  statut,
  now,
) {
  const payload = {
    statut,
  };

  if (statut === 'selectionne') {
    payload.propose_le = null;
    payload.repondu_le = null;
    payload.affecte_le = null;
  }

  if (
    statut === 'proposition_envoyee'
  ) {
    payload.propose_le = now;
    payload.repondu_le = null;
    payload.affecte_le = null;
  }

  if (
    statut === 'accepte' ||
    statut === 'refuse'
  ) {
    payload.repondu_le = now;
    payload.affecte_le = null;
  }

  if (statut === 'affecte') {
    payload.affecte_le = now;
  }

  if (statut === 'annule') {
    payload.affecte_le = null;
  }

  return payload;
}

/**
 * Empêche l'affectation si le formateur est déjà affecté sur une autre
 * mission comportant au moins une date commune.
 *
 * Aucun détail sur l'autre mission n'est retourné.
 */
async function assertTrainerCanBeAffected({
  missionId,
  formateurId,
}) {
  const { data, error } = await supabase.rpc(
    'trainer_has_affected_conflict',
    {
      p_mission_id:
        missionId,
      p_trainer_id:
        formateurId,
    },
  );

  if (error) {
    throw error;
  }

  if (data === true) {
    throw new Error(
      "Ce formateur n'est plus disponible sur cette période.",
    );
  }
}

/**
 * Recalcule les statuts automatiques d'un ou plusieurs formateurs.
 *
 * - Une proposition acceptée qui chevauche une mission affectée passe
 *   à "indisponible_affecte_ailleurs".
 * - Si le conflit disparaît, elle revient automatiquement à "accepte".
 */
async function reconcileTrainerConflicts(
  trainerIds,
) {
  const uniqueTrainerIds = [
    ...new Set(
      (trainerIds || []).filter(Boolean),
    ),
  ];

  for (const trainerId of uniqueTrainerIds) {
    await reconcileSingleTrainerConflicts(
      trainerId,
    );
  }
}

async function reconcileSingleTrainerConflicts(
  trainerId,
) {
  const { error } = await supabase.rpc(
    'reconcile_trainer_conflicts_safe',
    {
      p_trainer_id:
        trainerId,
    },
  );

  if (error) {
    throw error;
  }
}

async function getMissionTrainerIds(
  missionId,
) {
  const { data, error } = await supabase
    .from(MISSION_FORMATEURS_TABLE)
    .select('formateur_id')
    .eq('mission_id', missionId);

  if (error) {
    throw error;
  }

  return [
    ...new Set(
      (data || []).map(
        (row) => row.formateur_id,
      ),
    ),
  ];
}


async function syncMissionStatusWithAffectation(
  missionId,
) {
  const {
    data: affectedRows,
    error: affectedError,
  } = await supabase
    .from(MISSION_FORMATEURS_TABLE)
    .select('id')
    .eq('mission_id', missionId)
    .eq('statut', 'affecte')
    .limit(1);

  if (affectedError) {
    throw affectedError;
  }

  const hasAffectedTrainer =
    (affectedRows || []).length > 0;

  const {
    data: mission,
    error: missionError,
  } = await supabase
    .from(MISSIONS_TABLE)
    .select('statut')
    .eq('id', missionId)
    .single();

  if (missionError) {
    throw missionError;
  }

  const protectedStatuses = [
    'confirmee',
    'realisee',
    'annulee',
    'archivee',
  ];

  if (
    hasAffectedTrainer &&
    !protectedStatuses.includes(
      mission.statut,
    )
  ) {
    const { error: updateError } =
      await supabase
        .from(MISSIONS_TABLE)
        .update({
          statut: 'affectee',
        })
        .eq('id', missionId);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  if (
    !hasAffectedTrainer &&
    mission.statut === 'affectee'
  ) {
    const { error: resetError } =
      await supabase
        .from(MISSIONS_TABLE)
        .update({
          statut: 'a_pourvoir',
        })
        .eq('id', missionId);

    if (resetError) {
      throw resetError;
    }
  }
}

/**
 * Ajoute les dates d'une mission.
 */
async function insertMissionDates(
  missionId,
  dates,
) {
  const datesPayload = dates.map(
    (missionDate) => ({
      mission_id: missionId,
      date: missionDate.date,
      heure_debut:
        missionDate.heure_debut ||
        '09:00',
      heure_fin:
        missionDate.heure_fin ||
        '17:00',
    }),
  );

  const { data, error } = await supabase
    .from(MISSION_DATES_TABLE)
    .insert(datesPayload)
    .select('*')
    .order('date', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Détermine l'organisation propriétaire lors de la création.
 *
 * Le formulaire actuel ne transmet pas encore explicitement l'OF.
 * Tant qu'un utilisateur n'appartient qu'à un seul OF actif,
 * nous pouvons le déterminer sans ambiguïté.
 *
 * Si un utilisateur appartient demain à plusieurs OF,
 * l'appel devra fournir organizationId explicitement.
 */
async function resolveMissionOrganizationId(
  requestedOrganizationId = null,
) {
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const userId =
    userData?.user?.id;

  if (!userId) {
    throw new Error(
      'Utilisateur non authentifié.',
    );
  }

  let query = supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (requestedOrganizationId) {
    query = query.eq(
      'organization_id',
      requestedOrganizationId,
    );
  }

  const {
    data,
    error,
  } = await query.limit(2);

  if (error) {
    throw error;
  }

  const memberships =
    data || [];

  if (requestedOrganizationId) {
    if (memberships.length !== 1) {
      throw new Error(
        "Vous n'avez pas accès à cet organisme.",
      );
    }

    return requestedOrganizationId;
  }

  if (memberships.length === 1) {
    return memberships[0]
      .organization_id;
  }

  if (memberships.length === 0) {
    throw new Error(
      "Aucun organisme actif n'est rattaché à votre compte.",
    );
  }

  throw new Error(
    "Plusieurs organismes sont rattachés à votre compte. L'organisme actif doit être précisé.",
  );
}


/**
 * Nettoie les informations avant l'envoi à Supabase.
 */
function cleanMissionPayload(mission) {
  return {
    code_interne:
      cleanNullableText(
        mission.code_interne,
      ),

    client:
      cleanNullableText(
        mission.client,
      ),

    intitule:
      cleanNullableText(
        mission.intitule,
      ),

    formation:
      cleanNullableText(
        mission.formation,
      ),

    lieu: String(mission.lieu || '').trim(),

    adresse:
      cleanNullableText(
        mission.adresse,
      ),

    code_postal:
      cleanNullableText(
        mission.code_postal,
      ),

    ville:
      cleanNullableText(
        mission.ville,
      ),

    latitude:
      cleanNullableNumber(
        mission.latitude,
      ),

    longitude:
      cleanNullableNumber(
        mission.longitude,
      ),

    competences:
      cleanArray(
        mission.competences,
      ),

    materiel:
      cleanArray(
        mission.materiel,
      ),

    prix_vente:
      cleanNullableNumber(
        mission.prix_vente,
      ),

    cout_formateur:
      cleanNullableNumber(
        mission.cout_formateur,
      ),

    commentaire:
      cleanNullableText(
        mission.commentaire,
      ),

    statut:
      mission.statut ||
      'brouillon',
  };
}

/**
 * Vérifie les données obligatoires.
 */
function validateMission(
  mission,
  dates,
) {
  if (
    !mission ||
    typeof mission !== 'object'
  ) {
    throw new Error(
      'Les informations de la mission sont obligatoires.',
    );
  }

  if (
    !mission.adresse ||
    !mission.adresse.trim()
  ) {
    throw new Error(
      'L’adresse de la mission est obligatoire.',
    );
  }

  if (
    !mission.code_postal ||
    !mission.code_postal.trim()
  ) {
    throw new Error(
      'Le code postal de la mission est obligatoire.',
    );
  }

  if (
    !mission.ville ||
    !mission.ville.trim()
  ) {
    throw new Error(
      'La ville de la mission est obligatoire.',
    );
  }

  if (
    !Array.isArray(dates) ||
    dates.length === 0
  ) {
    throw new Error(
      'La mission doit contenir au moins une date.',
    );
  }

  const uniqueDates = new Set();

  dates.forEach((missionDate) => {
    if (!missionDate.date) {
      throw new Error(
        'Chaque journée de mission doit posséder une date.',
      );
    }

    if (
      uniqueDates.has(
        missionDate.date,
      )
    ) {
      throw new Error(
        `La date ${missionDate.date} est présente plusieurs fois.`,
      );
    }

    uniqueDates.add(
      missionDate.date,
    );

    const startTime =
      missionDate.heure_debut ||
      '09:00';

    const endTime =
      missionDate.heure_fin ||
      '17:00';

    if (endTime <= startTime) {
      throw new Error(
        `L'heure de fin doit être postérieure à l'heure de début pour le ${missionDate.date}.`,
      );
    }
  });
}

function sortMissionDates(mission) {
  if (!mission) {
    return mission;
  }

  return {
    ...mission,

    mission_dates: [
      ...(mission.mission_dates || []),
    ].sort(
      (firstDate, secondDate) =>
        firstDate.date.localeCompare(
          secondDate.date,
        ),
    ),
  };
}

function cleanNullableText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const cleanedValue =
    String(value).trim();

  return cleanedValue || null;
}

function cleanNullableNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const cleanedValue =
    Number(value);

  return Number.isFinite(
    cleanedValue,
  )
    ? cleanedValue
    : null;
}

function cleanArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
