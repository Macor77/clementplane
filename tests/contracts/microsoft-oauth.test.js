import { describe, expect, it, vi } from 'vitest';
import { MICROSOFT_SCOPES, microsoftAuthorizationUrl, microsoftTokenRequest, validateMicrosoftState } from '../../supabase/functions/_shared/calendar/microsoft-oauth.js';

describe('Microsoft OAuth PKCE', () => {
  it('requests only delegated calendar and identity scopes', () => {
    expect(MICROSOFT_SCOPES).toContain('Calendars.ReadWrite');
    expect(MICROSOFT_SCOPES).toContain('offline_access');
    expect(MICROSOFT_SCOPES).not.toContain('Calendars.ReadWrite.Shared');
  });
  it('builds an authorization code URL with state and S256 challenge', async () => {
    const url = new URL(await microsoftAuthorizationUrl({ clientId: 'client', redirectUri: 'https://app.clementplane.fr/microsoft-calendar-callback.html', state: 'state123', verifier: 'a'.repeat(64) }));
    expect(url.origin).toBe('https://login.microsoftonline.com');
    expect(url.searchParams.get('state')).toBe('state123');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('response_type')).toBe('code');
  });
  it('rejects expired or foreign states', () => {
    expect(() => validateMicrosoftState({ user_id: 'other', expires_at: '2099-01-01T00:00:00Z' }, 'user')).toThrow('INVALID_OAUTH_STATE');
    expect(() => validateMicrosoftState({ user_id: 'user', expires_at: '2020-01-01T00:00:00Z' }, 'user')).toThrow('INVALID_OAUTH_STATE');
  });
  it('exchanges a code server-side with verifier, without returning secrets in errors', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: 'access', refresh_token: 'refresh' }) });
    const grant = await microsoftTokenRequest(fetch, { clientId: 'client', clientSecret: 'secret', redirectUri: 'https://app.clementplane.fr/microsoft-calendar-callback.html', code: 'code', verifier: 'verifier' });
    expect(grant.refresh_token).toBe('refresh');
    const [, request] = fetch.mock.calls[0];
    expect(request.body.get('code_verifier')).toBe('verifier');
    expect(request.body.get('client_secret')).toBe('secret');
  });
  it('supports refresh token rotation', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: 'access2', refresh_token: 'refresh2' }) });
    await microsoftTokenRequest(fetch, { clientId: 'client', clientSecret: 'secret', refreshToken: 'refresh1' });
    expect(fetch.mock.calls[0][1].body.get('grant_type')).toBe('refresh_token');
  });
});
