import { test, expect } from '@playwright/test';

// UI integration with a simulated API, never a substitute for SQL/RLS or connected staging acceptance.
async function fakeTrainerApi(page) {
  let rows=[];let failNext=false;let sends=0;
  const user={id:'20000000-0000-0000-0000-000000000001',email:'alex@example.invalid',aud:'authenticated',role:'authenticated'};
  const token=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+36000,role:'authenticated'})).toString('base64url'),'test'].join('.');
  await page.addInitScript(({user,token})=>{localStorage.setItem('sb-example-auth-token',JSON.stringify({access_token:token,refresh_token:'fake',expires_at:Math.floor(Date.now()/1000)+36000,expires_in:36000,token_type:'bearer',user}));sessionStorage.setItem('timeforma_active_space','trainer');localStorage.setItem('clementplane_pwa_install_dismissed_at',String(Date.now()));},{user,token});
  await page.route('https://example.supabase.co/**',async route=>{
    const req=route.request();const url=new URL(req.url());const path=url.pathname;
    let data=[];let status=200;
    if(path.includes('/functions/')) {sends++;data={success:true};}
    else if(path.endsWith('/auth/v1/user'))data=user;
    else if(path.endsWith('/profiles'))data={id:user.id,first_name:'Alex',last_name:'Démo'};
    else if(path.endsWith('/trainers'))data={id:'10000000-0000-0000-0000-000000000001',prenom:'Alex',nom:'Démo',statut:'actif'};
    else if(path.endsWith('/trainer_personal_missions')) {
      const id=url.searchParams.get('id')?.slice(3);
      if(req.method()==='POST'||req.method()==='PATCH') {
        if(failNext){failNext=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Test failure'})});}
        const input=req.postDataJSON();const now=new Date().toISOString();
        if(req.method()==='POST'){data={...input,status:'confirmed',revision:1,created_at:now,updated_at:now};rows.push(data);}
        else {const row=rows.find(r=>r.id===id);Object.assign(row,input,{revision:row.revision+1,updated_at:now,cancelled_at:input.status==='cancelled'?now:null});data=row;}
      } else data=id?rows.find(r=>r.id===id)||null:rows;
    }
    else if(path.endsWith('/get_my_trainer_commitments_with_mission'))data=rows.filter(r=>r.status==='confirmed').flatMap(r=>r.dates.map(d=>({day:d.date,status:'mission',mission_id:r.id,mission_formateur_id:null,mission_title:r.title,organization_name:'Mission personnelle'})));
    else if(path.endsWith('/is_platform_admin'))data=false;
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  });
  return {fail:()=>{failNext=true;},rows:()=>rows,sends:()=>sends};
}
for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  test(`personal mission lifecycle ${viewport.width}px (API simulated)`,async({page})=>{
    await page.setViewportSize(viewport);const api=await fakeTrainerApi(page);
    const date=new Date();const day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-20`;
    await page.goto('/formateur/missions');
    await page.getByRole('link',{name:'Ajouter une mission',exact:true}).click();
    await page.getByLabel('Client final *').fill('Entreprise cliente fictive');
    await page.getByLabel('Formation',{exact:true}).fill('SST — groupe du matin');
    await page.getByLabel('Date 1',{exact:true}).fill(day);
    await page.getByLabel('Début 1',{exact:true}).fill('09:00');await page.getByLabel('Fin 1',{exact:true}).fill('12:00');
    await page.getByRole('button',{name:'Ajouter une date'}).click();
    await page.getByLabel('Date 2',{exact:true}).fill(day.slice(0,8)+'21');
    await page.getByLabel('Donneur d’ordre').fill('Atelier Démo');
    await page.getByLabel('Nom du site').fill('Centre Démo');
    await page.getByLabel('Adresse').fill('10 rue de la Formation');
    await page.getByLabel('Code postal *').fill('93200');
    await page.getByLabel('Ville *').fill('Saint-Denis');
    await page.getByLabel('Notes privées').fill('Note confidentielle fictive');
    api.fail();await page.getByRole('button',{name:'Enregistrer la mission',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText('Vos saisies sont conservées');
    await expect(page.getByLabel('Client final *')).toHaveValue('Entreprise cliente fictive');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`test-results/personal-form-${viewport.width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Enregistrer la mission',exact:true}).click();
    await expect(page.getByRole('dialog',{name:'Ajouter ce donneur d’ordre à Mes OF ?'})).toBeVisible();
    if(viewport.width<600){
      await page.getByRole('button',{name:'Oui, l’ajouter'}).click();
      await expect(page.getByLabel('Organisme de formation')).toHaveValue('Atelier Démo');
      await page.goBack();
      await expect(page.getByRole('dialog',{name:'Ajouter ce donneur d’ordre à Mes OF ?'})).toBeVisible();
    }
    await page.getByRole('button',{name:'Non, merci'}).click();
    await expect(page.getByRole('heading',{name:'SST — groupe du matin',exact:true})).toBeVisible();
    await page.reload();await expect(page.getByText('Note confidentielle fictive',{exact:true})).toBeVisible();
    await page.getByRole('link',{name:'Modifier',exact:true}).click();
    await page.getByLabel('Formation').fill('SST modifiée');
    await page.getByRole('button',{name:'Enregistrer les modifications'}).click();
    await expect(page.getByRole('heading',{name:'SST modifiée'})).toBeVisible();
    await page.goto('/formateur/espace');
    await page.getByRole('link',{name:'Ouvrir ma mission personnelle'}).click();
    await expect(page.getByRole('heading',{name:'SST modifiée'})).toBeVisible();
    await page.goto('/formateur/disponibilites');
    if(viewport.width<600) await page.getByRole('button',{name:/20 Mission confirmée/}).click();
    await page.getByRole('link',{name:'Voir la mission',exact:true}).first().click();
    await expect(page.getByRole('heading',{name:'SST modifiée'})).toBeVisible();
    await page.goto('/formateur/planning');
    await expect(page.locator('.trainer-planning-summary__item').filter({hasText:'confirmée'}).locator('strong')).toHaveText('1');
    await page.locator('.trainer-planning-day').filter({hasText:'SST modifiée'}).first().click();
    await page.getByRole('link',{name:'Voir la mission'}).click();
    await expect(page.getByRole('heading',{name:'SST modifiée'})).toBeVisible();
    await page.screenshot({path:`test-results/personal-detail-${viewport.width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Annuler la mission',exact:true}).click();
    await page.getByRole('button',{name:'Confirmer l’annulation',exact:true}).click();
    await expect(page.getByText('Annulée',{exact:true})).toBeVisible();
    await page.goto('/formateur/planning');await expect(page.locator('.trainer-planning-summary__item').filter({hasText:'confirmée'}).locator('strong')).toHaveText('0');
    expect(api.rows()).toHaveLength(1);expect(api.sends()).toBe(0);
  });
}
