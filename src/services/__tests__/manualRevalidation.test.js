import { describe, it, expect, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('../../lib/supabaseClient', () => ({ supabase: { rpc } }));
import * as service from '../missionsService';
describe('manual revalidation', () => {
  it('records an agreement independently from the initial notification channel', async () => {
    rpc.mockResolvedValue({ data: 'accepted', error: null });
    expect(await service.confirmMissionChangeForOrganization({ requestId:'request', trainerId:'trainer', channel:'phone', note:' Accord reçu ' })).toBe('accepted');
    expect(rpc).toHaveBeenLastCalledWith('confirm_mission_change_for_organization', { p_request_id:'request',p_trainer_id:'trainer',p_channel:'phone',p_note:'Accord reçu' });
  });
  it('does not report success when another response won', async () => {
    rpc.mockResolvedValue({ error:{ message:'CHANGE_ALREADY_RESPONDED' } });
    await expect(service.confirmMissionChangeForOrganization({requestId:'r',trainerId:'t',channel:'sms'})).rejects.toThrow(/déjà été traitée/);
  });
});
