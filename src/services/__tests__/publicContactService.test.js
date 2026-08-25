import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
vi.mock('../../lib/supabaseClient', () => ({ supabase: { functions: { invoke } } }));
const { submitPublicContact } = await import('../publicContactService');

describe('publicContactService', () => {
  beforeEach(() => invoke.mockReset());

  it('refuse un e-mail invalide avant tout appel réseau', async () => {
    await expect(submitPublicContact({ firstName: 'Ada', lastName: 'Lovelace', email: 'incorrect', profile: 'trainer', message: 'Bonjour' })).rejects.toThrow('adresse e-mail valide');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('normalise le payload et appelle uniquement submit-public-contact', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null });
    await submitPublicContact({ firstName: ' Ada ', lastName: ' Lovelace ', email: 'ADA@EXAMPLE.COM ', profile: 'trainer', message: ' Bonjour ', startedAt: 123 });
    expect(invoke).toHaveBeenCalledWith('submit-public-contact', { body: expect.objectContaining({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', profile: 'trainer', message: 'Bonjour', startedAt: 123 }) });
  });

  it('propage un échec backend sans prétendre que le message est envoyé', async () => {
    invoke.mockResolvedValue({ data: { success: false, message: 'Trop de messages' }, error: null });
    await expect(submitPublicContact({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', profile: 'trainer', message: 'Bonjour' })).rejects.toThrow('Trop de messages');
  });
});
