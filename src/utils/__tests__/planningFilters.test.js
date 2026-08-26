import { describe, expect, it } from 'vitest';
import {
  filterOrganizationMissions,
  filterTrainerPlanningItems,
  getOrganizationTrainerOptions,
  getTrainerOrganizationOptions,
} from '../planningFilters';

const assigned = (id, prenom, nom) => ({
  id: `mission-${id}`,
  mission_formateurs: [{ statut: 'affecte', formateur_id: id, trainer: { id, prenom, nom } }],
});

const unassigned = { id: 'mission-unassigned', mission_formateurs: [] };

describe('planning OF filters', () => {
  it('keeps every mission when no filter is selected', () => {
    const missions = [assigned('a', 'Alice', 'Martin'), unassigned];
    expect(filterOrganizationMissions(missions, { trainerIds: [], statuses: [] })).toEqual(missions);
  });

  it('filters by trainer and assignment status', () => {
    const alice = assigned('a', 'Alice', 'Martin');
    const bob = assigned('b', 'Bob', 'Durand');
    const missions = [alice, bob, unassigned];
    expect(filterOrganizationMissions(missions, { trainerIds: ['a'], statuses: ['assigned'] })).toEqual([alice]);
    expect(filterOrganizationMissions(missions, { trainerIds: [], statuses: ['unassigned'] })).toEqual([unassigned]);
  });

  it('builds unique trainer options sorted by name', () => {
    const options = getOrganizationTrainerOptions([
      assigned('b', 'Zoé', 'Bernard'),
      assigned('a', 'Alice', 'Martin'),
      assigned('a', 'Alice', 'Martin'),
      unassigned,
    ]);
    expect(options).toEqual([
      { id: 'a', label: 'Alice Martin' },
      { id: 'b', label: 'Zoé Bernard' },
    ]);
  });
});

describe('planning formateur filters', () => {
  const items = [
    { id: '1', organizationId: 'of-a', organizationName: 'Alter Prévention', status: 'affecte' },
    { id: '2', organizationId: 'of-b', organizationName: 'Beta Formation', status: 'accepte' },
    { id: '3', organizationId: 'of-a', organizationName: 'Alter Prévention', status: 'accepte' },
  ];

  it('keeps every item when no filter is selected', () => {
    expect(filterTrainerPlanningItems(items, { organizationIds: [], statuses: [] })).toEqual(items);
  });

  it('combines organization and status filters', () => {
    expect(filterTrainerPlanningItems(items, { organizationIds: ['of-a'], statuses: ['affecte'] })).toEqual([items[0]]);
  });

  it('builds unique organization options sorted by name', () => {
    expect(getTrainerOrganizationOptions(items)).toEqual([
      { id: 'of-a', label: 'Alter Prévention' },
      { id: 'of-b', label: 'Beta Formation' },
    ]);
  });
});

describe('planning day details', () => {
  it('returns only OF mission occurrences for the selected date', async () => {
    const { getOrganizationDayOccurrences } = await import('../planningFilters');
    const occurrences = [
      { date: '2026-09-07', mission: { id: 'm1' } },
      { date: '2026-09-08', mission: { id: 'm2' } },
      { date: '2026-09-07', mission: { id: 'm3' } },
    ];
    expect(getOrganizationDayOccurrences(occurrences, '2026-09-07').map((item) => item.mission.id)).toEqual(['m1', 'm3']);
  });

  it('returns only trainer planning items for the selected date', async () => {
    const { getTrainerDayItems } = await import('../planningFilters');
    const items = [
      { id: 'a', date: '2026-08-25' },
      { id: 'b', date: '2026-08-26' },
      { id: 'c', date: '2026-08-25' },
    ];
    expect(getTrainerDayItems(items, '2026-08-25').map((item) => item.id)).toEqual(['a', 'c']);
  });
});
