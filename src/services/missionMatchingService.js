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
  {
    locationQuery = '',
  } = {},
) {
  if (!mission) {
    return {
      formateurs: [],
      recognizedPlace: null,
    };
  }

  const trainersData =
    await getFormateurs(
      mission.organization_id,
    );

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
      organizationId: mission.organization_id,
      trainerIds,
      missionDates,
    }),

    loadMissionCommitments({
      trainerIds,
      missionDates,
      currentMissionId:
        mission.id,
      organizationId:
        mission.organization_id,
    }),
  ]);

  const {
    distances,
    recognizedPlace,
  } = await calculateMissionDistances({
    mission,
    formateurs,
    locationQuery,
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
  locationQuery = '',
}) {
  let targetCoords = null;
  let recognizedPlace = null;

  const cleanedLocationQuery =
    String(locationQuery || '').trim();

  const missionSearchQuery =
    buildMissionSearchQuery(mission);

  const searchQuery =
    cleanedLocationQuery ||
    missionSearchQuery;

  if (searchQuery) {
    try {
      const target = await geocodeQuery(
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
          searchQuery;
      }
    } catch (error) {
      console.error(
        'Erreur lors du géocodage du lieu de formation :',
        error,
      );
    }
  }

  if (
    !targetCoords &&
    !cleanedLocationQuery &&
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
  organizationId,
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
      organizationId,
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
  organizationId,
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
      organizationId,
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
    distances.get(formateur.id) ??
    distances.get(formateur) ??
    null;

  return {
    ...formateur,
    distance,
    availability,
    matchedCompetences,
    matchedMateriel,
  };
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
  if (
    first.distance !== null &&
    second.distance !== null
  ) {
    const distanceDifference =
      first.distance - second.distance;

    if (distanceDifference !== 0) {
      return distanceDifference;
    }
  } else if (first.distance !== null) {
    return -1;
  } else if (second.distance !== null) {
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
  ]
    .filter(Boolean)
    .join(', ');
}

function formatMissionLocation(
  mission,
) {
  return [
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
