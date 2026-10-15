import { test, expect } from '@playwright/test';
async function setup(page) {
  const user = { id: '20000000-0000-0000-0000-000000000001', email: 'demo@example.invalid', aud: 'authenticated', role: 'authenticated' };
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+36000, role: 'authenticated' })).toString('base64url'), 'fake'].join('.');
  const session = { access_token: token, refresh_token: 'fake', expires_at: Math.floor(Date.now()/1000)+36000, expires_in: 36000, token_type: 'bearer', user };
  await page.addInitScript(session => {
    localStorage.setItem('sb-example-auth-token', JSON.stringify(session));
    sessionStorage.setItem('timeforma_active_space', 'trainer');
    localStorage.setItem('clementplane_pwa_install_dismissed_at', String(Date.now()));
  }, session);
  const api = { failLoad: false, failSave: false, delayedSave: null, rows: [], unauthorized: false, refreshFails: false };
  await page.route('https://example.supabase.co/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data = [], status = 200;
    if (path.endsWith('/auth/v1/token')) {
      if(api.refreshFails) {status=400;data={error_code:'refresh_token_not_found',msg:'Invalid Refresh Token'};}
      else {api.unauthorized=false;data=session;}
    } else if(path.endsWith('/auth/v1/user')) data=user;
    else if(path.endsWith('/profiles')) data={id:user.id,first_name:'Camille',last_name:'Démo'};
    else if(path.endsWith('/trainers')) data={id:'10000000-0000-0000-0000-000000000001',prenom:'Camille',nom:'Démo'};
    else if(path.endsWith('/is_platform_admin')) data=false;
    else if(path.endsWith('/get_my_trainer_availability')) {
      if(api.unauthorized) {status=401;data={code:'42501',message:'permission denied'};}
      else if(api.failLoad) return route.abort('internetdisconnected');
      else data=api.rows;
    } else if(path.endsWith('/set_my_trainer_availability')) {
      if(api.delayedSave) await api.delayedSave;
      if(api.failSave) return route.abort('internetdisconnected');
      const body=route.request().postDataJSON();
      data=[{day:body.p_day,status:body.p_status,updated_at:new Date().toISOString()}];api.rows=data;
    }
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  });
  return api;
}
for(const width of [1440,390]) test(`availability recovery ${width}px (API simulated)`, async ({page}) => {
  await page.setViewportSize({width,height:900});
  const api=await setup(page);api.failLoad=true;
  await page.goto('/formateur/disponibilites');
  await expect(page.getByRole('alert')).toContainText('Connexion interrompue');
  await expect(page.getByRole('button',{name:'Disponible',exact:true})).toHaveCount(0);
  api.failLoad=false;
  await page.getByRole('button',{name:'Réessayer le chargement'}).click();
  if(width<600) await page.locator('.trainer-availability-mobile-day__summary').first().click();
  const available=page.getByRole('button',{name:'Disponible',exact:true}).filter({visible:true}).first();
  await expect(available).toBeVisible();
  let release;api.delayedSave=new Promise(resolve=>{release=resolve;});
  await available.click();await expect(page.getByRole('status')).toContainText('Enregistrement en cours');
  await expect(page.getByText(/Disponibilité du .* enregistrée/)).toHaveCount(0);
  release();await expect(page.getByRole('status')).toContainText('enregistrée');api.delayedSave=null;
  await page.reload();
  if(width<600) await page.locator('.trainer-availability-mobile-day__summary').first().click();
  api.failSave=true;
  await page.getByRole('button',{name:'Indisponible',exact:true}).filter({visible:true}).first().click();
  await expect(page.getByRole('alert')).toContainText('enregistrement non confirmé');
  await expect(page.getByText(/Disponibilité du .* enregistrée/)).toHaveCount(0);
  api.failSave=false;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/availability-recovery-${width}.png`,fullPage:true});
});
test('401 renews session without hanging the screen (API simulated)', async ({page}) => {
  const api=await setup(page);api.unauthorized=true;
  await page.goto('/formateur/disponibilites');
  await expect(page.getByRole('button',{name:'Disponible',exact:true}).first()).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
