function assignedRelation(mission) {
  return (mission?.mission_formateurs || []).find((item) => item.statut === 'affecte') || null;
}

export function getOrganizationTrainerOptions(missions) {
  const trainers = new Map();
  for (const mission of missions || []) {
    const relation = assignedRelation(mission);
    const trainer = relation?.trainer;
    const id = relation?.formateur_id || trainer?.id;
    if (!id || !trainer) continue;
    const label = `${trainer.prenom || ''} ${trainer.nom || ''}`.trim() || 'Formateur';
    trainers.set(String(id), { id: String(id), label });
  }
  return [...trainers.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

export function filterOrganizationMissions(missions, { trainerIds = [], statuses = [] } = {}) {
  const trainerSet = new Set(trainerIds.map(String));
  const statusSet = new Set(statuses);
  return (missions || []).filter((mission) => {
    const relation = assignedRelation(mission);
    const trainerId = relation?.formateur_id || relation?.trainer?.id;
    const status = relation ? 'assigned' : 'unassigned';
    return (trainerSet.size === 0 || (trainerId && trainerSet.has(String(trainerId)))) &&
      (statusSet.size === 0 || statusSet.has(status));
  });
}

export function getTrainerOrganizationOptions(items) {
  const organizations = new Map();
  for (const item of items || []) {
    if (!item.organizationId) continue;
    organizations.set(String(item.organizationId), {
      id: String(item.organizationId),
      label: item.organizationName || 'Organisme de formation',
    });
  }
  return [...organizations.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

export function filterTrainerPlanningItems(items, { organizationIds = [], statuses = [] } = {}) {
  const organizationSet = new Set(organizationIds.map(String));
  const statusSet = new Set(statuses);
  return (items || []).filter((item) =>
    (organizationSet.size === 0 || (item.organizationId && organizationSet.has(String(item.organizationId)))) &&
    (statusSet.size === 0 || statusSet.has(item.status)),
  );
}

export function getOrganizationDayOccurrences(occurrences, date) {
  if (!date) return [];
  return (occurrences || []).filter((occurrence) => occurrence?.date === date);
}

export function getTrainerDayItems(items, date) {
  if (!date) return [];
  return (items || []).filter((item) => item?.date === date);
}
