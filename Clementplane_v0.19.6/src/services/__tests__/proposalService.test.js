import { describe, expect, it, vi } from 'vitest';

const { rpc, invoke } = vi.hoisted(() => ({
  rpc: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    rpc,
    functions: { invoke },
  },
}));

import {
  getPublicMissionProposal,
  respondToMissionProposal,
  notifyOrganizationOfMissionResponse,
} from '../proposalService';

describe('proposalService — réponses publiques', () => {
  it('refuse un lien sans token', async () => {
    await expect(getPublicMissionProposal(''))
      .rejects.toThrow('Le lien de proposition est incomplet.');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('refuse toute réponse autre que accepte/refuse', async () => {
    await expect(respondToMissionProposal('token', 'affecte'))
      .rejects.toThrow('Réponse non reconnue.');
    expect(rpc).not.toHaveBeenCalled();
  });

  it("n'envoie pas de notification pour une réponse invalide", async () => {
    await expect(notifyOrganizationOfMissionResponse('token', 'affecte'))
      .resolves.toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });
});
