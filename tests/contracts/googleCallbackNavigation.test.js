import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { PWA_OPTIONS } from '../../pwa.config.js';

let navigation;
beforeAll(async () => {
  vi.stubGlobal('self', globalThis);
  vi.stubGlobal('__WB_DISABLE_DEV_LOGS', true);
  const { NavigationRoute } = await import('workbox-routing/NavigationRoute.js');
  navigation = new NavigationRoute(() => new Response('app shell'), {
    denylist: PWA_OPTIONS.workbox.navigateFallbackDenylist,
  });
});
afterAll(() => vi.unstubAllGlobals());

it.each([
  '/google-calendar-callback.html',
  '/google-calendar-callback.html?code=FAKE_CODE&state=FAKE_STATE',
  '/google-calendar-callback.html?error=access_denied&state=FAKE_STATE',
])('keeps %s out of the installed PWA app shell', (path) => {
  expect(navigation.match({
    request: { mode: 'navigate' },
    url: new URL(path, 'https://example.test'),
  })).toBe(false);
});

it('still serves app routes through the installed PWA app shell', () => {
  expect(navigation.match({
    request: { mode: 'navigate' },
    url: new URL('https://example.test/formateur/parametres?source=planning'),
  })).toBe(true);
});
