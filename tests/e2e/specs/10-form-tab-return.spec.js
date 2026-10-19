import { test, expect } from '@playwright/test';
async function setup(page, organization = false) {
  const user = { id: '20000000-0000-0000-0000-000000000001', email: 'demo@example.invalid', aud: 'authenticated', role: 'authenticated' };
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+36000, role: 'authenticated' })).toString('base64url'), 'fake'].join('.');
  const session = { access_token: token, refresh_token: 'fake', expires_at: Math.floor(Date.now()/1000)+36000, expires_in: 36000, token_type: 'bearer', user };
  await page.addInitScript(session => {
    localStorage.setItem('sb-example-auth-token', JSON.stringify(session));
    sessionStorage.setItem('timeforma_active_space', 'trainer');
    localStorage.setItem('clementplane_pwa_install_dismissed_at', String(Date.now()));
  }, session);
  await page.route('https://example.supabase.co/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data = [], status = 200;
    if(path.endsWith('/auth/v1/user')) data=user;
    else if(path.endsWith('/profiles')) data={id:user.id,first_name:'Camille',last_name:'Démo'};
    else if(path.endsWith('/organization_members')) data=organization?[{id:'membership-demo',role:'owner',organization:{id:'30000000-0000-0000-0000-000000000001',name:'OF Démo'}}]:[];
    else if(path.endsWith('/trainers')) data=organization?null:{id:'10000000-0000-0000-0000-000000000001',prenom:'Camille',nom:'Démo'};
    else if(path.endsWith('/is_platform_admin')) data=false;
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  });
}

// Exercises the real SDK visibility recovery with simulated API and fictitious data.
for (const organization of [false, true]) {
  for (const width of [1440, 390]) {
    test(`unsaved mission survives tab return ${organization ? 'OF' : 'trainer'} ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await setup(page, organization);
      await page.goto(organization ? '/missions/new' : '/formateur/missions/nouvelle');
      const input = organization ? page.locator('input').first() : page.getByLabel('Client final *');
      await input.fill('Client fictif — saisie non enregistrée');
      await page.evaluate(() => {
        window.originalMissionInput = document.querySelector('input');
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
      });
      // Allow the SDK lock and deferred auth callbacks to finish before asserting preservation.
      await page.waitForTimeout(700);
      await expect(input).toHaveValue('Client fictif — saisie non enregistrée');
      expect(await page.evaluate(() => window.originalMissionInput === document.querySelector('input'))).toBe(true);
      // A real logout from another tab must still remove private content.
      await page.evaluate(() => {
        localStorage.removeItem('sb-example-auth-token');
        const channel = new BroadcastChannel('sb-example-auth-token');
        channel.postMessage({ event: 'SIGNED_OUT', session: null });
        channel.close();
      });
      await expect(page).toHaveURL(/connexion/);
    });
  }
}
