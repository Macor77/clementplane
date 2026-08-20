import {
  getMyTrainerAvailability,
  getMyTrainerCommitments,
} from './trainerAvailabilityService';


export async function getMyAvailabilitySharePreview({
  startDay,
  endDay,
  organizationId = null,
}) {
  const [
    availabilityRows,
    commitmentRows,
  ] = await Promise.all([
    getMyTrainerAvailability({
      startDay,
      endDay,
    }),

    getMyTrainerCommitments({
      startDay,
      endDay,
    }),
  ]);


  const availabilityByDay = {};

  for (const row of availabilityRows || []) {
    availabilityByDay[row.day] = row.status || '';
  }


  const commitmentsByDay = {};

  for (const row of commitmentRows || []) {
    if (!commitmentsByDay[row.day]) {
      commitmentsByDay[row.day] = [];
    }

    commitmentsByDay[row.day].push({
      status: row.status || '',
      organizationId:
        row.organization_id || null,
      missionId:
        row.mission_id || null,
      missionFormateurId:
        row.mission_formateur_id || null,
    });
  }


  return {
    availabilityByDay,
    commitmentsByDay,
    recipientOrganizationId:
      organizationId || null,
  };
}


export function getSharedDayState({
  day,
  availabilityByDay,
  commitmentsByDay,
  recipientOrganizationId,
}) {
  const declaredStatus =
    availabilityByDay?.[day] || '';

  const commitments =
    commitmentsByDay?.[day] || [];


  const missionWithRecipient =
    Boolean(recipientOrganizationId) &&
    commitments.some(
      (item) =>
        item.status === 'mission' &&
        item.organizationId ===
          recipientOrganizationId,
    );


  if (missionWithRecipient) {
    return {
      key: 'mission_with_recipient',
      label: 'Mission avec votre organisme',
      tone: 'mission',
      otherOptionsCount: 0,
    };
  }


  const missionWithAnotherOrganization =
    commitments.some(
      (item) =>
        item.status === 'mission',
    );


  if (missionWithAnotherOrganization) {
    return {
      key: 'unavailable',
      label: 'Indisponible',
      tone: 'unavailable',
      otherOptionsCount: 0,
    };
  }


  if (declaredStatus === 'indispo') {
    return {
      key: 'unavailable',
      label: 'Indisponible',
      tone: 'unavailable',
      otherOptionsCount: 0,
    };
  }


  const optionWithRecipient =
    Boolean(recipientOrganizationId) &&
    commitments.some(
      (item) =>
        item.status === 'option' &&
        item.organizationId ===
          recipientOrganizationId,
    );


  if (optionWithRecipient) {
    return {
      key: 'option_with_recipient',
      label: 'Option avec votre organisme',
      tone: 'option',
      otherOptionsCount: 0,
    };
  }


  const otherOptionsCount =
    commitments.filter(
      (item) =>
        item.status === 'option' &&
        (
          !recipientOrganizationId ||
          item.organizationId !==
            recipientOrganizationId
        ),
    ).length;


  if (declaredStatus === 'dispo') {
    return {
      key: 'available',
      label: 'Disponible',
      tone: 'available',
      otherOptionsCount,
    };
  }


  return {
    key: 'unknown',
    label: 'Non renseigné',
    tone: 'unknown',
    otherOptionsCount: 0,
  };
}
