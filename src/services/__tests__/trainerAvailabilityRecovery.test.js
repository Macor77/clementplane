import { beforeEach, expect, it, vi } from 'vitest';
const { rpc, getSession, refreshSession } = vi.hoisted(() => ({ rpc: vi.fn(), getSession: vi.fn(), refreshSession: vi.fn() }));
vi.mock('../../lib/supabaseClient', () => ({ supabase: { rpc, auth: { getSession, refreshSession } } }));
import { getMyTrainerAvailability, setMyTrainerAvailability } from '../trainerAvailabilityService';
beforeEach(() => {
  vi.resetAllMocks();
  getSession.mockResolvedValue({ data: { session: { user: { id: 'test' }, expires_at: Date.now() / 1000 + 3600 } }, error: null });
  refreshSession.mockResolvedValue({ data: { session: { user: { id: 'test' } } }, error: null });
});
it('refuse une sauvegarde sans confirmation serveur', async () => {
  rpc.mockResolvedValue({ data: [], error: null });
  await expect(setMyTrainerAvailability({ day: '2026-11-03', status: 'dispo' })).rejects.toThrow();
});
it('renouvelle la session après un rejet 401 puis relit', async () => {
  rpc.mockResolvedValueOnce({ status: 401, error: { code: '42501' } }).mockResolvedValueOnce({ data: [{ day: '2026-11-03', status: 'dispo' }], error: null });
  await expect(getMyTrainerAvailability({ startDay: '2026-11-01', endDay: '2026-11-30' })).resolves.toEqual([{ day: '2026-11-03', status: 'dispo' }]);
});
it('demande une reconnexion si la session manque', async () => {
  getSession.mockResolvedValue({ data: { session: null }, error: null });
  rpc.mockResolvedValue({ data: [], error: null });
  await expect(getMyTrainerAvailability({})).rejects.toMatchObject({ code: 'SESSION_REQUIRED' });
});
it('ne rejoue pas une écriture après une panne réseau ambiguë', async () => {
  rpc.mockResolvedValue({ status: 0, error: { message: 'Failed to fetch' } });
  await expect(setMyTrainerAvailability({ day: '2026-11-03', status: 'dispo' })).rejects.toMatchObject({ message: 'Failed to fetch' });
  expect(rpc).toHaveBeenCalledTimes(1);
});
it('ne transforme pas un refus 403 en problème de session', async () => {
  rpc.mockResolvedValue({ status: 403, error: { code: '42501' } });
  await expect(getMyTrainerAvailability({})).rejects.toMatchObject({ code: '42501' });
  expect(refreshSession).not.toHaveBeenCalled();
});
