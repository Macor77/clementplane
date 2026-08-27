import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

import {
  createMission,
  updateMissionFormateurStatus,
} from '../missionsService';

const validMission = {
  code_postal: '77500',
  ville: 'Chelles',
  lieu: 'Centre de formation',
  statut: 'a_pourvoir',
};

const validDates = [
  {
    date: '2026-09-15',
    heure_debut: '09:00',
    heure_fin: '17:00',
  },
];

describe('missionsService — garde-fous métier avant Supabase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuse une mission sans informations', async () => {
    await expect(createMission({ mission: null, dates: validDates }))
      .rejects.toThrow('Les informations de la mission sont obligatoires.');
  });

  it('refuse une mission sans code postal', async () => {
    await expect(createMission({
      mission: { ...validMission, code_postal: '   ' },
      dates: validDates,
    })).rejects.toThrow('Le code postal de la mission est obligatoire.');
  });

  it('refuse une mission sans ville', async () => {
    await expect(createMission({
      mission: { ...validMission, ville: '' },
      dates: validDates,
    })).rejects.toThrow('La ville de la mission est obligatoire.');
  });

  it('refuse une mission sans date', async () => {
    await expect(createMission({ mission: validMission, dates: [] }))
      .rejects.toThrow('La mission doit contenir au moins une date.');
  });

  it('refuse deux journées à la même date', async () => {
    await expect(createMission({
      mission: validMission,
      dates: [validDates[0], { ...validDates[0] }],
    })).rejects.toThrow('La date 2026-09-15 est présente plusieurs fois.');
  });

  it("refuse une heure de fin antérieure ou égale à l'heure de début", async () => {
    await expect(createMission({
      mission: validMission,
      dates: [{
        date: '2026-09-15',
        heure_debut: '17:00',
        heure_fin: '17:00',
      }],
    })).rejects.toThrow("L'heure de fin doit être postérieure");
  });

  it('refuse un statut formateur inconnu', async () => {
    await expect(updateMissionFormateurStatus('mission-1', 'trainer-1', 'pirate'))
      .rejects.toThrow('Statut de formateur non reconnu : pirate');
  });

  it('interdit de forcer manuellement le statut conflit automatique', async () => {
    await expect(updateMissionFormateurStatus(
      'mission-1',
      'trainer-1',
      'indisponible_affecte_ailleurs',
    )).rejects.toThrow('Ce statut est géré automatiquement.');
  });
});
