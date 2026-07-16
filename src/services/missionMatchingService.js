import { getFormateurs } from './formateursService';
import { getAvailabilitiesForMonth } from './availabilityService';
import { getTrainerMissionCommitments } from './missionsService';
import {
  geocodeQuery,
  hasValidCoords,
} from './geocodingService';
import { buildDistanceMap } from './distanceService';

export async function getMissionRecommendations(
  mission,
) {
  if (!mission) {
    return {
      formateurs: [],
      recognizedPlace: null,
    };
  }

  const trainersData =
    await getFormateurs();

  const formateurs = (
    trainersData || []
  ).map((trainer) => ({
    id: trainer.id,
    prenom: trainer.prenom ?? '',
    nom: trainer.nom ?? '',
    ville: trainer.ville ?? '',
    codePostal:
      trainer.code_postal ?? '',
    adresse: trainer.adresse ?? '',
    competences: normalizeArray(
      trainer.competences,
    ),
    materiel: normalizeArray(
      trainer.materiel,
    ),
    statut:
      trainer.statut ?? 'Inactif',
    tarif: trainer.tarif ?? null,
    latitude:
      trainer.latitude ?? null,
    longitude:
      trainer.longitude ?? null,
  }));

  const missionDates = (
    mission.mission_dates || []
  )
    .map(
      (missionDate) =>
        missionDate.date,
    )
    .filter(Boolean)
    .sort();

  const trainerIds = formateurs
    .map(
      (formateur) => formateur.id,
    )
    .filter(Boolean);

  const [
    availabilityMap,
    missionCommitmentMap,
  ] = await Promise.all([
    loadMissionAvailabilities({
      trainerIds,
      missionDates,
    }),

    loadMissionCommitments({
      trainerIds,
      missionDates,
      currentMissionId:
        mission.id,
    }),
  ]);

  const {
    distances,
    recognizedPlace,
  } = await calculateMissionDistances({
    mission,
    formateurs,
  });

  const requiredCompetences =
    normalizeArray(
      mission.competences,
    );

  const requiredMateriel =
    normalizeArray(
      mission.materiel,
    );

  const recommendations =
    formateurs
      .map((formateur) =>
        buildRecommendation({
          formateur,
          missionDates,
          availabilityMap,
          missionCommitmentMap,
          distances,
          requiredCompetences,
          requiredMateriel,
        }),
      )
      .sort(compareRecommendations);

  return {
    formateurs: recommendations,
    recognizedPlace,
  };
}

async function calculateMissionDistances({
  mission,
  formateurs,
}) {
  let targetCoords = null;
  let recognizedPlace = null;

  if (
    hasValidCoords(
      mission.latitude,
      mission.longitude,
    )
  ) {
    targetCoords = {
      latitude:
        Number(mission.latitude),
      longitude:
        Number(mission.longitude),
    };

    recognizedPlace =
      formatMissionLocation(mission);
  } else {
    const searchQuery =
      buildMissionSearchQuery(mission);

    if (searchQuery) {
      try {
        const target =
          await geocodeQuery(
            `${searchQuery}, France`,
          );

        if (
          target &&
          hasValidCoords(
            target.latitude,
            target.longitude,
          )
        ) {
          targetCoords = target;

          recognizedPlace =
            target.displayName ||
            formatMissionLocation(
              mission,
            );
        }
      } catch (error) {
        console.error(
          'Erreur lors du calcul des distances de la mission :',
          error,
        );
      }
    }
  }

  if (!targetCoords) {
    return {
      distances: new Map(),
      recognizedPlace: null,
    };
  }

  return {
    distances: buildDistanceMap({
      formateurs,
      targetCoords,
      hasValidCoords,
    }),

    recognizedPlace,
  };
}

async function loadMissionAvailabilities({
  trainerIds,
  missionDates,
}) {
  if (
    trainerIds.length === 0 ||
    missionDates.length === 0
  ) {
    return {};
  }

  const rows =
    await getAvailabilitiesForMonth({
      trainerIds,
      startDay: missionDates[0],
      endDay:
        missionDates[
          missionDates.length - 1
        ],
    });

  const availabilityMap = {};

  for (const row of rows) {
    if (
      !availabilityMap[
        row.trainer_id
      ]
    ) {
      availabilityMap[
        row.trainer_id
      ] = {};
    }

    availabilityMap[
      row.trainer_id
    ][row.day] =
      row.status ?? '';
  }

  return availabilityMap;
}

/**
 * Les options acceptées sont chargées mais ne modifient jamais le score.
 * Seules les missions réellement affectées rendent le formateur
 * indisponible.
 */
async function loadMissionCommitments({
  trainerIds,
  missionDates,
  currentMissionId,
}) {
  if (
    trainerIds.length === 0 ||
    missionDates.length === 0
  ) {
    return {};
  }

  const rows =
    await getTrainerMissionCommitments({
      trainerIds,
      startDay: missionDates[0],
      endDay:
        missionDates[
          missionDates.length - 1
        ],
      excludeMissionId:
        currentMissionId,
    });

  const commitmentMap = {};

  for (const row of rows) {
    if (
      !commitmentMap[
        row.formateur_id
      ]
    ) {
      commitmentMap[
        row.formateur_id
      ] = [];
    }

    commitmentMap[
      row.formateur_id
    ].push(row);
  }

  return commitmentMap;
}

function buildRecommendation({
  formateur,
  missionDates,
  availabilityMap,
  missionCommitmentMap,
  distances,
  requiredCompetences,
  requiredMateriel,
}) {
  const trainerAvailability =
    availabilityMap[
      formateur.id
    ] || {};

  const trainerCommitments =
    missionCommitmentMap[
      formateur.id
    ] || [];

  const availability =
    getAvailabilitySummary({
      missionDates,
      trainerAvailability,
      trainerCommitments,
    });

  const matchedCompetences =
    getMatches(
      requiredCompetences,
      formateur.competences,
    );

  const matchedMateriel =
    getMatches(
      requiredMateriel,
      formateur.materiel,
    );

  const distance =
    distances.get(
      formateur.id,
    ) ?? null;

  const score = calculateScore({
    formateur,
    availability,
    distance,
    requiredCompetences,
    matchedCompetences,
    requiredMateriel,
    matchedMateriel,
  });

  return {
    ...formateur,
    distance,
    score,
    availability,
    matchedCompetences,
    matchedMateriel,
  };
}

function calculateScore({
  formateur,
  availability,
  distance,
  requiredCompetences,
  matchedCompetences,
  requiredMateriel,
  matchedMateriel,
}) {
  let score = 0;

  const normalizedStatus =
    normalizeText(
      formateur.statut,
    );

  if (
    normalizedStatus === 'premium'
  ) {
    score += 30;
  } else if (
    normalizedStatus === 'standard'
  ) {
    score += 20;
  } else if (
    normalizedStatus === 'inactif'
  ) {
    score -= 40;
  } else if (
    normalizedStatus === 'black'
  ) {
    score -= 100;
  }

  if (
    availability.status ===
    'available'
  ) {
    score += 35;
  }

  if (
    availability.status ===
    'unknown'
  ) {
    score += 5;
  }

  if (
    availability.status ===
    'unavailable'
  ) {
    score -= 100;
  }

  /*
   * Aucun bonus ni malus n'est appliqué aux options.
   * Une option signifie que le formateur a accepté une proposition,
   * mais qu'il reste disponible tant qu'aucune affectation n'est faite.
   */

  if (distance !== null) {
    if (distance <= 20) {
      score += 30;
    } else if (distance <= 50) {
      score += 22;
    } else if (distance <= 100) {
      score += 14;
    } else if (distance <= 200) {
      score += 6;
    } else {
      score -= 5;
    }
  }

  if (
    requiredCompetences.length > 0
  ) {
    score +=
      (matchedCompetences.length /
        requiredCompetences.length) *
      40;
  }

  if (
    requiredMateriel.length > 0
  ) {
    score +=
      (matchedMateriel.length /
        requiredMateriel.length) *
      20;
  }

  return Math.round(score);
}

function getAvailabilitySummary({
  missionDates,
  trainerAvailability,
  trainerCommitments,
}) {
  if (missionDates.length === 0) {
    return {
      status: 'unknown',
      label:
        'Disponibilité non vérifiable',
      reason: 'unknown',
      availableCount: 0,
      unavailableCount: 0,
      unknownCount: 0,
    };
  }

  const hasAffectedMissionConflict =
    trainerCommitments.some(
      (commitment) =>
        commitment.statut ===
          'affecte' &&
        commitment.dates.some(
          (date) =>
            missionDates.includes(date),
        ),
    );

  if (hasAffectedMissionConflict) {
    return {
      status: 'unavailable',
      label:
        'Indisponible sur la période',
      reason: 'affected_mission',
      availableCount: 0,
      unavailableCount:
        missionDates.length,
      unknownCount: 0,
    };
  }

  let availableCount = 0;
  let unavailableCount = 0;
  let unknownCount = 0;

  for (const date of missionDates) {
    const status =
      trainerAvailability[date] || '';

    if (status === 'dispo') {
      availableCount += 1;
    } else if (
      status === 'indispo' ||
      status === 'mission'
    ) {
      unavailableCount += 1;
    } else {
      unknownCount += 1;
    }
  }

  if (unavailableCount > 0) {
    return {
      status: 'unavailable',
      label:
        unavailableCount === 1
          ? 'Indisponible sur 1 date'
          : `Indisponible sur ${unavailableCount} dates`,
      reason:
        'declared_unavailable',
      availableCount,
      unavailableCount,
      unknownCount,
    };
  }

  if (
    availableCount ===
    missionDates.length
  ) {
    return {
      status: 'available',
      label:
        'Disponible sur toutes les dates',
      reason:
        'declared_available',
      availableCount,
      unavailableCount,
      unknownCount,
    };
  }

  if (availableCount > 0) {
    return {
      status: 'partial',
      label: `${availableCount}/${missionDates.length} dates confirmées disponibles`,
      reason: 'partial',
      availableCount,
      unavailableCount,
      unknownCount,
    };
  }

  return {
    status: 'unknown',
    label:
      'Disponibilité non renseignée',
    reason: 'unknown',
    availableCount,
    unavailableCount,
    unknownCount,
  };
}

function compareRecommendations(
  first,
  second,
) {
  const firstUnavailable =
    first.availability.status ===
    'unavailable';

  const secondUnavailable =
    second.availability.status ===
    'unavailable';

  if (
    firstUnavailable !==
    secondUnavailable
  ) {
    return firstUnavailable ? 1 : -1;
  }

  if (
    second.score !== first.score
  ) {
    return (
      second.score - first.score
    );
  }

  if (
    first.distance !== null &&
    second.distance !== null
  ) {
    return (
      first.distance -
      second.distance
    );
  }

  if (first.distance !== null) {
    return -1;
  }

  if (second.distance !== null) {
    return 1;
  }

  return `${first.nom} ${first.prenom}`.localeCompare(
    `${second.nom} ${second.prenom}`,
    'fr',
  );
}

function getMatches(
  requiredValues,
  trainerValues,
) {
  const normalizedTrainerValues =
    trainerValues.map(
      normalizeText,
    );

  return requiredValues.filter(
    (requiredValue) =>
      normalizedTrainerValues.includes(
        normalizeText(
          requiredValue,
        ),
      ),
  );
}

function buildMissionSearchQuery(
  mission,
) {
  return [
    mission.adresse,
    mission.code_postal,
    mission.ville,
    mission.lieu,
  ]
    .filter(Boolean)
    .join(', ');
}

function formatMissionLocation(
  mission,
) {
  return [
    mission.lieu,
    mission.adresse,
    [
      mission.code_postal,
      mission.ville,
    ]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(', ');
}

function normalizeArray(value) {
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

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .trim()
    .toLowerCase();
}
