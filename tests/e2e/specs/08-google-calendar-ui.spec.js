import {test,expect} from '@playwright/test';
async function setup(page,{disconnected=false,missions=[],proposals=[]}={}){
 const user={id:'20000000-0000-0000-0000-000000000001',email:'alex@example.invalid',aud:'authenticated',role:'authenticated'};
 const token=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+36000,role:'authenticated'})).toString('base64url'),'test'].join('.');
 let state={mode:'testing',status:'active',account_email:'alex.demo@example.invalid',calendar_name:'Clementplane',calendar_url:'https://calendar.google.com/',include_fee:false,include_notes:false,last_success_at:'2026-10-08T08:00:00Z',pending:false};if(disconnected)state.status='disconnected';const actions=[];
 await page.addInitScript(({user,token})=>{localStorage.setItem('sb-example-auth-token',JSON.stringify({access_token:token,refresh_token:'fake',expires_at:Math.floor(Date.now()/1000)+36000,expires_in:36000,token_type:'bearer',user}));sessionStorage.setItem('timeforma_active_space','trainer');localStorage.setItem('clementplane_pwa_install_dismissed_at',String(Date.now()));},{user,token});
 await page.route('https://example.supabase.co/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let data=[];
  if(path.endsWith('/functions/v1/google-calendar')){
   const body=req.postDataJSON();actions.push(body);
   if(body.action==='settings')state={...state,include_fee:body.include_fee,include_notes:body.include_notes,pending:true};
   if(body.action==='disconnect')state={...state,status:'disconnected',pending:false};
   if(body.action==='sync')state={...state,pending:true};
   data=state;
  }else if(path.endsWith('/auth/v1/user'))data=user;
  else if(path.endsWith('/profiles'))data={id:user.id,first_name:'Alex',last_name:'Démo'};
  else if(path.endsWith('/trainers'))data={id:'10000000-0000-0000-0000-000000000001',prenom:'Alex',nom:'Démo',statut:'actif'};
  else if(path.endsWith('/is_platform_admin'))data=false;
  else if(path.endsWith('/trainer_personal_missions'))data=missions;
  else if(path.endsWith('/get_my_mission_proposals'))data=proposals;
  else if(path.endsWith('/respond_to_my_mission_proposal')){proposals=proposals.map(p=>({...p,status:req.postDataJSON().p_response}));data=true;}
  await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });return actions;
}
for(const width of [1440,390])test(`Google settings ${width}px (API simulated)`,async({page})=>{
 await page.setViewportSize({width,height:900});const actions=await setup(page);await page.goto('/formateur/parametres');
 const card=page.locator('#google-agenda');await expect(card.getByRole('heading',{name:'Google Agenda'})).toBeVisible();await expect(card).toContainText('Accès de test');
 await expect(card.getByLabel('Inclure la rémunération')).not.toBeChecked();await expect(card.getByLabel('Inclure mes notes privées')).not.toBeChecked();
 // This controlled input reflects the server acknowledgement, not an optimistic local toggle.
 // check()/uncheck() assert synchronously after clicking, before the async request can finish.
 await card.getByLabel('Inclure la rémunération').click();await expect(card.getByLabel('Inclure la rémunération')).toBeChecked();
 await card.getByLabel('Inclure la rémunération').click();await expect(card.getByLabel('Inclure la rémunération')).not.toBeChecked();
 await card.locator('summary').click();await expect(card).toContainText('Partager votre agenda principal ne partage pas automatiquement ce calendrier');
 await card.getByRole('button',{name:'Relancer la synchronisation'}).click();await expect(card).toContainText('Synchronisation demandée');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await card.screenshot({path:`test-results/google-calendar-${width}.png`});
 await card.getByRole('button',{name:'Déconnecter Google',exact:true}).click();await card.getByRole('button',{name:'Confirmer la déconnexion'}).click();await expect(card).toContainText('Google est déconnecté');await expect(card.getByRole('button',{name:'Connecter Google',exact:true})).toBeVisible();
 expect(actions.filter(a=>a.action==='settings').map(a=>a.include_fee)).toEqual([true,false]);expect(actions.filter(a=>a.action==='disconnect')).toHaveLength(1);
});
test('OAuth callback bypasses installed PWA, rejects unsolicited state and strips authorization query',async({page})=>{
 await setup(page);
 await page.goto('/formateur/parametres');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload();
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 await page.goto('/google-calendar-callback.html?code=FAKE_CODE&state=unrequested');await expect(page).toHaveURL(/\/formateur\/parametres#google-agenda$/);await expect(page.locator('#google-agenda')).toContainText('La connexion Google n’a pas abouti');expect(await page.evaluate(()=>sessionStorage.getItem('cp_google_oauth_return'))).toBeNull();
});


for(const width of [1440,390])test(`First mission Google invitation ${width}px (API simulated)`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await setup(page,{disconnected:true,missions:[{id:'personal-1',formation:'SST Démo',title:'Client fictif',status:'confirmed',dates:[]}]});
 await page.goto('/formateur/missions');
 const invitation=page.getByRole('heading',{name:'Vos missions dans Google Agenda'});
 await expect(invitation).toBeVisible();
 await expect(page.getByRole('link',{name:'Connecter Google Agenda'})).toHaveAttribute('href','/formateur/parametres#google-agenda');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/google-invitation-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Plus tard'}).click();await expect(invitation).toHaveCount(0);
 await page.reload();await expect(invitation).toHaveCount(0);
 await page.goto('/formateur/parametres');await expect(page.locator('#google-agenda')).toBeVisible();
});
test('Google invitation waits for a mission (API simulated)',async({page})=>{
 await setup(page,{disconnected:true});await page.goto('/formateur/missions');
 await expect(page.getByRole('heading',{name:'Vos missions dans Google Agenda'})).toHaveCount(0);
});

test('Acceptance invites without navigating away (API simulated)',async({page})=>{
 await setup(page,{disconnected:true,proposals:[{mission_formateur_id:'proposal-1',mission_id:'mission-1',mission_title:'SST fictif',status:'proposition_envoyee',dates:[{date:'2026-11-10'}]}]});
 await page.goto('/formateur/propositions');
 await expect(page.getByRole('heading',{name:'Vos missions dans Google Agenda'})).toHaveCount(0);
 await page.getByRole('button',{name:'Voir la proposition'}).click();
 await page.getByRole('button',{name:'Accepter la mission'}).click();
 await expect(page.getByRole('heading',{name:'Vos missions dans Google Agenda'})).toBeVisible();
});
test('Connected trainers do not receive the invitation (API simulated)',async({page})=>{
 await setup(page,{missions:[{id:'personal-1',status:'confirmed',dates:[]}]});await page.goto('/formateur/missions');
 await expect(page.getByRole('heading',{name:'Vos missions dans Google Agenda'})).toHaveCount(0);
});
