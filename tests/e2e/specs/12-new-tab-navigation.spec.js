import { test, expect } from '@playwright/test';

const missionId = '40000000-0000-0000-0000-000000000001';
const trainerId = '10000000-0000-0000-0000-000000000001';
async function setup(context, { dual = false, activeSpace = 'organization', organization = true } = {}) {
  // External font CSS can block deferred SPA startup in popup tabs.
  // This navigation contract must not depend on Google's font CDN.
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType:'text/css',body:''}));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());
  const user = { id: '20000000-0000-0000-0000-000000000001', email: 'demo@example.invalid', aud: 'authenticated', role: 'authenticated' };
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+36000, role: 'authenticated' })).toString('base64url'), 'fake'].join('.');
  await context.addInitScript(({ user, token, activeSpace }) => {
    // Popup initialization also runs in an opaque about:blank document.
    // Seed only the real local app document, where Web Storage is accessible.
    if (location.origin !== 'http://127.0.0.1:4173') return;
    if (!localStorage.getItem('sb-example-auth-token')) localStorage.setItem('sb-example-auth-token', JSON.stringify({ access_token: token, refresh_token: 'fake', expires_at: Math.floor(Date.now()/1000)+36000, expires_in: 36000, token_type: 'bearer', user }));
    if (activeSpace) sessionStorage.setItem('timeforma_active_space', activeSpace);
    localStorage.setItem('clementplane_pwa_install_dismissed_at', String(Date.now()));
  }, { user, token, activeSpace });
  const day = new Date(); day.setDate(28);
  const mission = { id: missionId, reference: 'DEMO-ONGLETS', formation: 'Formation fictive onglets', client: 'Client fictif', statut: 'active', mission_dates: [{ id: 'date-demo', date: `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-28`, heure_debut: '09:00', heure_fin: '12:00' }], mission_formateurs: [] };
  await context.route('https://example.supabase.co/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname;
    let data = [];
    if (path.endsWith('/auth/v1/user')) data = user;
    else if (path.endsWith('/profiles')) data = { id: user.id, first_name: 'Camille', last_name: 'Démo' };
    else if (path.endsWith('/organization_members')) data = organization ? [{ id: 'membership-demo', role: 'owner', organization: { id: '30000000-0000-0000-0000-000000000001', name: 'OF Démo' } }] : [];
    else if (path.endsWith('/trainers')) data = url.searchParams.has('id') || dual ? { id: trainerId, prenom: 'Camille', nom: 'Démo', competences: [], materiel: [] } : null;
    else if (path.endsWith('/organization_trainers')) {
      const row = { id: 'relation-demo', trainer_id: trainerId, statut: 'Standard', trainer: { id: trainerId, prenom: 'Camille', nom: 'Démo', competences: [], materiel: [] } };
      data = url.searchParams.has('trainer_id') ? row : [row];
    }
    else if (path.endsWith('/trainer_personal_missions')) {
      const row = { id: missionId, trainer_id: trainerId, title: 'Client fictif', formation: 'Mission personnelle onglets', dates: mission.mission_dates, status: 'confirmed', revision: 1 };
      data = url.searchParams.has('id') ? row : [row];
    }
    else if (path.endsWith('/missions')) data = url.searchParams.has('id') ? mission : [mission];
    else if (path.endsWith('/is_platform_admin')) data = false;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
}

test('mission links support right-click, Ctrl-click, middle-click and ordinary navigation', async ({ context, page }) => {
  await setup(context);
  await page.goto('/missions');
  const link = page.locator('a.of-mission-row');
  await expect(link).toHaveAttribute('href', `/missions/${missionId}`);
  await link.click({ button: 'right' });
  await expect(page).toHaveURL(/\/missions$/);
  await page.keyboard.press('Escape');
  for (const options of [{ modifiers: ['Control'] }, { button: 'middle' }]) {
    const opened = context.waitForEvent('page');
    await page.bringToFront();
    await link.click(options);
    const tab = await opened;
    await tab.bringToFront();
    await expect(tab).toHaveURL(new RegExp(`/missions/${missionId}$`));
    await expect(tab.getByText('Formation fictive onglets', { exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/missions$/);
    await tab.close();
    await page.bringToFront();
  }
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/missions/${missionId}$`));
});

for (const activeSpace of [null, 'trainer']) {
  test(`explicit OF URL survives fresh dual-role tab with space ${activeSpace}`, async ({ context, page }) => {
    await setup(context, { dual: true, activeSpace });
    await page.goto(`/missions/${missionId}`);
    await expect(page.getByText('Formation fictive onglets', { exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/missions/${missionId}$`));
    await page.reload();
    await expect(page.getByText('Formation fictive onglets', { exact: true }).first()).toBeVisible();
  });
}

test('planning card retains day summary on ordinary click and opens mission with Ctrl-click', async ({ context, page }) => {
  await setup(context);
  await page.goto('/planning');
  const card = page.locator('a.mission-calendar-card').first();
  await expect(card).toHaveAttribute('href', `/missions/${missionId}`);
  const opened = context.waitForEvent('page');
  await card.click({ modifiers: ['Control'] });
  const tab = await opened;
  await tab.bringToFront();
  await expect(tab).toHaveURL(new RegExp(`/missions/${missionId}$`));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await tab.close();
  await page.bringToFront();
  await card.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voir la mission' })).toHaveAttribute('href', `/missions/${missionId}`);
});

for (const width of [1440, 390]) {
  test(`trainer links and keyboard navigation ${width}px`, async ({ context, page }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(context, { dual: true, activeSpace: null });
    await page.goto('/listing');
    const link = page.getByRole('link', { name: 'Camille Démo', exact: true });
    await expect(link).toHaveAttribute('href', `/formateur/view/${trainerId}`);
    await expect(page.getByRole('link', { name: 'Voir', exact: true })).toHaveAttribute('href', `/formateur/view/${trainerId}`);
    await expect(page.getByRole('link', { name: 'Modifier', exact: true })).toHaveAttribute('href', `/formateur/edit/${trainerId}`);
    const opened = context.waitForEvent('page');
    await link.click({ button: 'middle' });
    const tab = await opened;
    await tab.bringToFront();
    await expect(tab).toHaveURL(new RegExp(`/formateur/view/${trainerId}$`));
    await expect(tab.getByRole('heading', { name: /Camille Démo/ })).toBeVisible();
    await expect(page).toHaveURL(/\/listing$/);
    await tab.close();
    await page.bringToFront();
    await page.screenshot({ path: `test-results/new-tab-listing-${width}.png`, fullPage: true });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/formateur/view/${trainerId}$`));
  });

  test(`personal planning links preserve summary and new tab ${width}px`, async ({ context, page }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(context, { dual: true, activeSpace: 'trainer', organization: false });
    await page.goto('/formateur/planning');
    const link = page.locator('a.trainer-planning-mini').first();
    await expect(link).toHaveAttribute('href', `/formateur/missions/personnelles/${missionId}`);
    const opened = context.waitForEvent('page');
    await link.click({ button: 'middle' });
    const tab = await opened;
    await tab.bringToFront();
    await expect(tab.getByRole('heading', { name: 'Mission personnelle onglets', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await tab.close();
    await page.bringToFront();
    await link.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: `test-results/new-tab-planning-${width}.png`, fullPage: true });
    await expect(page.getByRole('link', { name: 'Voir la mission' })).toHaveAttribute('href', `/formateur/missions/personnelles/${missionId}`);
    expect(await page.locator('button a, a button, a a').count()).toBe(0);
  });
}

test('signed-out direct link requires login', async ({ page }) => {
  await page.goto(`/missions/${missionId}`);
  await expect(page).toHaveURL(/\/connexion$/);
  await expect(page.getByText('Formation fictive onglets')).toHaveCount(0);
});

test('trainer without organization cannot view an OF mission', async ({ context, page }) => {
  await setup(context, { dual: true, activeSpace: 'trainer', organization: false });
  await page.goto(`/missions/${missionId}`);
  await expect(page).toHaveURL(/\/formateur\/espace$/);
  await expect(page.getByText('Formation fictive onglets')).toHaveCount(0);
});


test('OF-only accounts still follow the existing trainer claim flow', async ({ context, page }) => {
  await setup(context);
  await context.route('**/rest/v1/rpc/get_my_trainer_claim_candidates', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: trainerId, prenom: 'Camille', nom: 'Démo' }]) }));
  await page.goto('/listing');
  await expect(page).toHaveURL(/\/formateur\/revendication$/);
});
