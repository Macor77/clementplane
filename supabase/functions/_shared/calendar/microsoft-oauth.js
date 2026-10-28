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
  constructor(status, reason = null, retryAfter = 0) {
    super('MICROSOFT_OAUTH_FAILED');
    this.status = status;
    this.reason = reason;
    this.retryable = status === 429 || status >= 500;
    this.retryAfter = retryAfter;
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
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const reason = ['invalid_grant', 'interaction_required', 'consent_required'].includes(data.error) ? data.error : null;
    throw new MicrosoftOAuthError(response.status, reason, Math.min(86400, Math.max(0, Number(response.headers?.get('Retry-After')) || 0)));
  }
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

// Identity comes from the authenticated OIDC endpoint, never from an unverified ID token.
export async function microsoftIdentity(fetcher, token) {
  let response;
  try {
    response = await fetcher('https://graph.microsoft.com/oidc/userinfo', {
      headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(10000),
    });
  } catch { throw new MicrosoftOAuthError(503); }
  if (!response.ok) throw new MicrosoftOAuthError(response.status);
  const identity = await response.json();
  if (typeof identity.sub !== 'string' || !identity.sub) throw new Error('INVALID_MICROSOFT_IDENTITY');
  return {sub:identity.sub, email:typeof identity.email === 'string' ? identity.email : null};
}
export function validateMicrosoftGrant(grant) {
  if (!grant.scope?.split(' ').some(scope => scope.toLowerCase().replace('https://graph.microsoft.com/', '') === 'calendars.readwrite')) throw new Error('MISSING_CALENDAR_SCOPE');
}
