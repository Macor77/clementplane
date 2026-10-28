import { challenge } from './crypto.js';

// Delegated access: never request access to the user's other calendars for
// scheduling decisions. Microsoft may require tenant administrator consent.
export const MICROSOFT_SCOPES = Object.freeze([
  'openid', 'profile', 'email', 'offline_access', 'Calendars.ReadWrite',
]);
const AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0';

export async function microsoftAuthorizationUrl({ clientId, redirectUri, state, verifier }) {
  if (!clientId || !redirectUri || !state || !verifier) throw new Error('INVALID_OAUTH_CONFIGURATION');
  const redirect = new URL(redirectUri);
  if (redirect.protocol !== 'https:' && redirect.hostname !== 'localhost') throw new Error('INVALID_REDIRECT_URI');
  const url = new URL(`${AUTHORITY}/authorize`);
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: MICROSOFT_SCOPES.join(' '),
    state,
    code_challenge: await challenge(verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return url.href;
}

export class MicrosoftOAuthError extends Error {
  constructor(status) {
    super('MICROSOFT_OAUTH_FAILED');
    this.status = status;
  }
}

export async function microsoftTokenRequest(fetcher, { clientId, clientSecret, redirectUri, code, verifier, refreshToken }) {
  if (!clientId || !clientSecret || (!code && !refreshToken) || (code && !verifier)) {
    throw new Error('INVALID_OAUTH_CONFIGURATION');
  }
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: refreshToken ? 'refresh_token' : 'authorization_code',
    scope: MICROSOFT_SCOPES.join(' '),
    ...(refreshToken ? { refresh_token: refreshToken } : {
      code, code_verifier: verifier, redirect_uri: redirectUri,
    }),
  });
  let response;
  try {
    response = await fetcher(`${AUTHORITY}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(10000),
    });
  } catch { throw new MicrosoftOAuthError(503); }
  if (!response.ok) throw new MicrosoftOAuthError(response.status);
  const grant = await response.json();
  if (!grant.access_token || (!refreshToken && !grant.refresh_token)) {
    throw new Error('INVALID_MICROSOFT_GRANT');
  }
  return grant;
}

export function validateMicrosoftState(row, userId, now = Date.now()) {
  if (!row || row.user_id !== userId || !Number.isFinite(Date.parse(row.expires_at)) || Date.parse(row.expires_at) <= now) {
    throw new Error('INVALID_OAUTH_STATE');
  }
}
