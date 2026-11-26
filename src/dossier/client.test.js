import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'fictional' } } }) } },
}));

describe('confirmation d’un dépôt', () => {
  const draft = { doc: 'document-fictif', request: 'version-fictive' };
  let call;
  let UploadUnconfirmedError;
  let fetch;

  beforeAll(async () => {
    vi.stubEnv('VITE_DOSSIER_ENABLED', 'true');
    vi.stubEnv('VITE_DOSSIER_API', 'https://dossier.example.invalid');
    ({ call, UploadUnconfirmedError } = await import('./client'));
  });
  beforeEach(() => {
    fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
  });
  afterAll(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each([
    [200, '{"id":"autre-document"}'],
    [200, '{"id":'],
    [502, ''],
    [408, ''],
  ])('demande une vérification pour la réponse %i %s', async (status, body) => {
    fetch.mockResolvedValue(new Response(body, { status }));
    await expect(call('upload', draft)).rejects.toBeInstanceOf(UploadUnconfirmedError);
  });

  it('transmet le refus explicite pour permettre une correction', async () => {
    fetch.mockResolvedValue(Response.json({ detail: 'Le fichier a été refusé.' }, { status: 422 }));
    const error = await call('upload', draft).catch((reason) => reason);
    expect(error.message).toBe('Le fichier a été refusé.');
    expect(error).not.toBeInstanceOf(UploadUnconfirmedError);
  });

  it('conserve le nombre de notifications limitées dans la confirmation', async () => {
    const receipt = { id: draft.doc, notifications_limited: 2 };
    fetch.mockResolvedValue(Response.json(receipt));
    await expect(call('upload', draft)).resolves.toEqual(receipt);
  });
});
