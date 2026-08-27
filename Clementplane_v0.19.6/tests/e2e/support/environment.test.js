import { describe, expect, it } from 'vitest';
import { assertSafeE2EEnvironment } from './environment.js';

const SAFE_REF = 'abcdefghijklmnopqrst';
const SAFE_URL = `https://${SAFE_REF}.supabase.co`;

describe('assertSafeE2EEnvironment', () => {
  it('refuse la production Clementplane', () => {
    expect(() => assertSafeE2EEnvironment({
      url: 'https://hctvkynrgmnxjynbncdi.supabase.co',
      allowReset: 'true',
      expectedProjectRef: 'hctvkynrgmnxjynbncdi',
    })).toThrow(/production/i);
  });
  it('refuse un reset non explicitement autorisé', () => {
    expect(() => assertSafeE2EEnvironment({ url: SAFE_URL, allowReset: 'false', expectedProjectRef: SAFE_REF })).toThrow(/E2E_ALLOW_RESET/i);
  });
  it('refuse une URL qui ne correspond pas à la ref E2E attendue', () => {
    expect(() => assertSafeE2EEnvironment({ url: SAFE_URL, allowReset: 'true', expectedProjectRef: 'zzzzzzzzzzzzzzzzzzzz' })).toThrow(/différente/i);
  });
  it('accepte uniquement le projet E2E explicitement attendu', () => {
    expect(() => assertSafeE2EEnvironment({ url: SAFE_URL, allowReset: 'true', expectedProjectRef: SAFE_REF })).not.toThrow();
  });
});
