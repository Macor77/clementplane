import { test, expect } from '@playwright/test';

test('serves Clementplane PWA metadata', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0B132B');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');

  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  const data = await manifest.json();
  expect(data.name).toBe('Clementplane');
  expect(data.display).toBe('standalone');
});

const OFFICIAL_ORIGIN = 'https://app.clementplane.fr';
const PREVIEW_ORIGIN = 'https://clementplane-preview.example.invalid';

async function mobileTrainer(page, request, { ios = false, standalone = false } = {}) {
  const user = { id: '20000000-0000-0000-0000-000000000001', email: 'demo@example.invalid', aud: 'authenticated', role: 'authenticated' };
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 36000, role: 'authenticated' })).toString('base64url'), 'test'].join('.');
  await page.addInitScript(({ user, token, ios, standalone }) => {
    localStorage.setItem('sb-example-auth-token', JSON.stringify({ access_token: token, refresh_token: 'fake', expires_at: Math.floor(Date.now() / 1000) + 36000, expires_in: 36000, token_type: 'bearer', user }));
    sessionStorage.setItem('timeforma_active_space', 'trainer');
    if (ios) Object.defineProperty(navigator, 'userAgent', { value: 'iPhone Mobile Safari' });
    if (standalone) Object.defineProperty(navigator, 'standalone', { value: true });
    window.installPromptCalls = 0;
  }, { user, token, ios, standalone });
  await page.route('https://example.supabase.co/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data = [];
    if (path.endsWith('/auth/v1/user')) data = user;
    else if (path.endsWith('/profiles')) data = { id: user.id, first_name: 'Alex', last_name: 'Démo' };
    else if (path.endsWith('/trainers')) data = { id: '10000000-0000-0000-0000-000000000001', prenom: 'Alex', nom: 'Démo', statut: 'actif' };
    else if (path.endsWith('/is_platform_admin')) data = false;
    else if (path.includes('/functions/')) data = { mode: 'disabled', status: 'disconnected' };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
  // Exercise real browser origins with the local build; never contact production.
  await page.route(/^https:\/\/(app\.clementplane\.fr|clementplane-preview\.example\.invalid)\//, async (route) => {
    const url = new URL(route.request().url());
    const response = await request.get(`http://127.0.0.1:4173${url.pathname}${url.search}`);
    await route.fulfill({ response });
  });
}

async function installPrompt(page) {
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { window.installPromptCalls++; };
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);
  });
}

test.describe('installation origin on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36', serviceWorkers: 'block' });

  for (const ios of [false, true]) {
    test(`temporary origin opens official site before installation (${ios ? 'iOS' : 'Android'})`, async ({ page, request }) => {
      await mobileTrainer(page, request, { ios });
      await page.goto(`${PREVIEW_ORIGIN}/formateur/missions?test=private-value`);
      await expect(page.locator('.pwa-notice--install')).toBeVisible();
      await installPrompt(page);
      const officialLink = page.getByRole('link', { name: 'Ouvrir la version officielle' });
      await expect(officialLink).toHaveAttribute('href', OFFICIAL_ORIGIN);
      await expect(page.getByRole('button', { name: 'Installer Clementplane', exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => window.installPromptCalls)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/pwa-official-link-${ios ? 'ios' : 'android'}.png`, fullPage: true });
      const navigation = page.waitForRequest((req) => req.isNavigationRequest() && req.url() === `${OFFICIAL_ORIGIN}/`);
      await officialLink.click();
      expect((await navigation).headers().referer).toBeUndefined();
      await expect(page).toHaveURL(/^https:\/\/app\.clementplane\.fr\//);
      await expect(page.getByRole('button', { name: ios ? 'Voir comment installer' : 'Installer Clementplane', exact: true })).toBeVisible();
      await page.waitForLoadState('load');
    });
  }

  test('official Android install uses the native prompt', async ({ page, request }) => {
    await mobileTrainer(page, request);
    await page.goto(`${OFFICIAL_ORIGIN}/formateur/missions`);
    await expect(page.locator('.pwa-notice--install')).toBeVisible();
    await installPrompt(page);
    await page.getByRole('button', { name: 'Installer Clementplane', exact: true }).click();
    expect(await page.evaluate(() => window.installPromptCalls)).toBe(1);
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
    await expect(page.locator('.pwa-notice--install')).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('link', { name: 'Ajouter une mission', exact: true })).toBeVisible();
    await expect(page.locator('.pwa-notice--install')).toHaveCount(0);
  });

  test('official iOS install shows Safari instructions', async ({ page, request }) => {
    await mobileTrainer(page, request, { ios: true });
    await page.goto(`${OFFICIAL_ORIGIN}/formateur/missions`);
    await page.getByRole('button', { name: 'Voir comment installer' }).click();
    await expect(page.locator('.pwa-notice--install')).toContainText('Sur l’écran d’accueil');
    expect(await page.evaluate(() => window.installPromptCalls)).toBe(0);
  });

  test('standalone PWA keeps trainer mission creation available without install invitation', async ({ page, request }) => {
    await mobileTrainer(page, request, { standalone: true });
    await page.goto(`${OFFICIAL_ORIGIN}/formateur/missions`);
    await expect(page.getByRole('link', { name: 'Ajouter une mission', exact: true })).toBeVisible();
    await expect(page.locator('.pwa-notice--install')).toHaveCount(0);
    await page.getByRole('link', { name: 'Ajouter une mission', exact: true }).click();
    await expect(page.getByLabel('Client final *')).toBeVisible();
  });
});
