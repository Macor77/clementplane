import { test, expect } from '@playwright/test';
async function setup(page, organization = true) {
  const user = { id: '20000000-0000-0000-0000-000000000001', email: 'demo@example.invalid', aud: 'authenticated', role: 'authenticated' };
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+36000, role: 'authenticated' })).toString('base64url'), 'fake'].join('.');
  const session = { access_token: token, refresh_token: 'fake', expires_at: Math.floor(Date.now()/1000)+36000, expires_in: 36000, token_type: 'bearer', user };
  await page.addInitScript(session => {
    localStorage.setItem('sb-example-auth-token', JSON.stringify(session));
    sessionStorage.setItem('timeforma_active_space', 'trainer');
    localStorage.setItem('clementplane_pwa_install_dismissed_at', String(Date.now()));
  }, session);
  let accepted = false, attempts = 0;
  await page.route('https://example.supabase.co/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data = [], status = 200;
    if(path.endsWith('/auth/v1/user')) data=user;
    else if(path.endsWith('/profiles')) data={id:user.id,first_name:'Camille',last_name:'Démo'};
    else if(path.endsWith('/organization_members')) data=organization?[{id:'membership-demo',role:'owner',organization:{id:'30000000-0000-0000-0000-000000000001',name:'OF Démo'}}]:[];
    else if(path.endsWith('/trainers')) data=organization?null:{id:'10000000-0000-0000-0000-000000000001',prenom:'Camille',nom:'Démo'};
    else if(path.endsWith('/is_platform_admin')) data=false;
    else if(path.endsWith('/missions')) data={id:'50000000-0000-0000-0000-000000000001',statut:'ouverte',formation:'SST',client:'Client Démo',mission_dates:[{date:'2026-11-01',heure_debut:'09:00',heure_fin:'17:00'}],mission_formateurs:[{id:'relation',formateur_id:'trainer',statut:'affecte',trainer:{id:'trainer',prenom:'Alex',nom:'Démo'}}]};
    else if(path.endsWith('/get_pending_mission_change_for_organization')) data=accepted?[]:[{request_id:'request',request_status:'pending',trainer_responses:[{trainer_id:'trainer',mission_formateur_id:'relation',previous_status:'affecte',response_status:'pending',trainer_name:'Alex Démo'}]}];
    else if(path.endsWith('/confirm_mission_change_for_organization')) {
      attempts++;
      expect(route.request().postDataJSON()).toEqual({p_request_id:'request',p_trainer_id:'trainer',p_channel:'phone',p_note:'Accord reçu'});
      if(attempts===1){status=500;data={message:'network failure'};}else{accepted=true;data='accepted';}
    }
    else if(path.includes('/functions/')) throw new Error('No outbound notification permitted');
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  });
}


for (const width of [1440,390]) {
  test(`manual agreement after email, failure and retry ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    await setup(page);
    await page.goto('/missions/50000000-0000-0000-0000-000000000001');
    await page.getByRole('button',{name:'Confirmer l’accord du formateur'}).click();
    const form=page.getByRole('form',{name:'Accord de Alex Démo'});
    await expect(form.getByRole('button',{name:'Enregistrer l’accord'})).toBeDisabled();
    await form.getByLabel('Moyen de réception').selectOption('phone');
    await form.getByLabel('Commentaire facultatif').fill('Accord reçu');
    await form.getByRole('checkbox').check();
    await form.getByRole('button',{name:'Enregistrer l’accord'}).click();
    await expect(form.getByRole('alert')).toContainText('Vérifiez votre connexion');
    await expect(form.getByLabel('Commentaire facultatif')).toHaveValue('Accord reçu');
    await page.screenshot({path:`test-results/manual-revalidation-${width}.png`,fullPage:true});
    await form.getByRole('button',{name:'Enregistrer l’accord'}).click();
    await expect(page.getByRole('button',{name:'Confirmer l’accord du formateur'})).toHaveCount(0);
    await expect(page.getByText('Formateur affecté',{exact:true}).first()).toBeVisible();
  });
}
