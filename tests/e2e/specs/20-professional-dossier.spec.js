import { test, expect } from '@playwright/test';
import { fixture } from '../support/activity-fixture';
const api = 'https://dossier.example.invalid/v1/';
for(const width of [390,1440]) test(`dossier formateur et reprise · ${width}px · API simulée`,async ({page})=>{
  await page.setViewportSize({width,height:870});
  await fixture(page);
  const doc = {id:'doc1',version_id:'version1',kind:'cv',title:'CV fictif',expiry_mode:'unknown',note:'Note fictive'};
  const data={documents:[doc],partners:[],shares:[],reminders:[]};
  const posts=[];
  await page.route(api+'**',async route=>{
    const action=route.request().url().split('/').pop();
    if(action==='upload'){
      posts.push(route.request().postDataJSON());
      if(posts.length===1)return route.abort('failed');
    }
    return route.fulfill({json:action==='overview'?data:{}});
  });
  await page.goto('/formateur/dossier');
  await expect(page.getByRole('heading',{name:'Mon dossier professionnel'})).toBeVisible();
  await expect(page.getByText('Échéance à renseigner · Privé')).toBeVisible();
  await page.getByRole('button',{name:'Déposer un document'}).click();
  await page.getByLabel('Intitulé').fill('Diplôme fictif');
  await page.getByLabel(/Fichier PDF/).setInputFiles({name:'fictif.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-fixture')});
  await page.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Connexion interrompue');
  await expect(page.getByLabel('Intitulé')).toHaveValue('Diplôme fictif');
  await page.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(page.getByText('Document enregistré.')).toBeVisible();
  expect(posts[0]).toEqual(posts[1]);
  await page.getByRole('button',{name:'Nouveau partage'}).click();
  await page.getByLabel('Adresse e-mail').fill('recette@example.invalid');
  await page.getByRole('button',{name:'Tous les documents actuellement présents'}).click();
  await page.getByRole('button',{name:'Vérifier le partage'}).click();
  await expect(page.getByText(/copies déjà téléchargées/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/dossier-recap-${width}.png`});
});
test('invité isolé, octets hors cache et aucun accès OF en écriture · API simulée',async({page})=>{
  const calls=[];
  await page.route(api+'**',async r=>{
    const action=r.request().url().split('/').pop();calls.push(action);
    if(action==='guest-file')return r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+cR9sAAAAASUVORK5CYII=','base64'),headers:{'cache-control':'no-store'}});
    return r.fulfill({json:action==='verify-code'?{session:'ticket-fictif'}:action==='guest-list'?[{id:'d',version_id:'v',title:'Attestation fictive',expiry_mode:'none'}]:{}});
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/dossier-invite.html#invitation-fictive');
  await expect(page.getByRole('button',{name:'Télécharger'})).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe('');
  await page.getByRole('button',{name:'Demander mon code'}).click();
  await page.getByLabel('Code reçu par e-mail').fill('12345678');
  await page.getByRole('button',{name:'Ouvrir le dossier'}).click();
  await page.getByRole('button',{name:'Consulter'}).click();
  await expect(page.getByRole('img',{name:/Attestation fictive/})).toBeVisible();
  expect(calls).toEqual(['request-code','verify-code','guest-list','guest-file']);
  expect(await page.evaluate(async()=>{for(const name of await caches.keys()){if((await (await caches.open(name)).keys()).some(r=>r.url.includes('/v1/')))return false;}return true;})).toBe(true);
  await fixture(page,'organization',true);
  await page.route(api+'inbox',r=>r.fulfill({json:[]}));
  await page.goto('/dossiers-recus');
  await expect(page.getByRole('heading',{name:'Dossiers reçus'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Déposer|Remplacer/})).toHaveCount(0);
});
