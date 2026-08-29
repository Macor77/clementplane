import { describe, expect, it, vi, beforeEach } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { rpc },
}));

import { getAvailabilitiesForMonth } from '../availabilityService';

describe('availabilityService — disponibilités effectives OF', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuse de charger les disponibilités OF sans organisme', async () => {
    await expect(getAvailabilitiesForMonth({
      organizationId: null,
      trainerIds: ['trainer-1'],
      startDay: '2026-09-01',
      endDay: '2026-09-30',
    })).resolves.toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('charge les disponibilités effectives via la RPC cloisonnée de l’organisme', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'availability-1',
          trainer_id: 'trainer-1',
          day: '2026-09-15',
          status: 'dispo',
          updated_at: '2026-08-29T08:00:00Z',
          source: 'trainer',
        },
      ],
      error: null,
    });

    const rows = await getAvailabilitiesForMonth({
      organizationId: 'org-1',
      trainerIds: ['trainer-1'],
      startDay: '2026-09-01',
      endDay: '2026-09-30',
    });

    expect(rows).toHaveLength(1);
    expect(rpc).toHaveBeenCalledWith(
      'get_organization_trainer_availability',
      {
        p_organization_id: 'org-1',
        p_trainer_ids: ['trainer-1'],
        p_start_day: '2026-09-01',
        p_end_day: '2026-09-30',
      },
    );
  });
});
