import { test, expect } from '@playwright/test';
import { fixture, id } from '../support/activity-fixture';
for(const width of [1440,390]) test(`trainer activity ${width}px — simple totals, errors, reload, statistics (API simulated)`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.clock.setFixedTime(new Date('2026-11-14T10:00:00Z'));const api=await fixture(page);
  await page.goto(`/formateur/missions/personnelles/${id}`);
  const panel=page.locator('#bilan');
  await expect(panel.getByRole('heading',{name:'Bilan de la mission'})).toBeVisible();
  await expect(panel).toContainText('Formation : SST fictive');
  await expect(panel.getByRole('textbox',{name:/Formation/})).toHaveCount(0);
  await expect(panel.getByRole('button',{name:/Ajouter.*(?:groupe|session)|Retirer/})).toHaveCount(0);
  await expect(panel.getByText(/Effectif prévu|Durée pédagogique prévue/)).toHaveCount(0);
  await page.getByRole('combobox',{name:'Formation réalisée',exact:true}).selectOption('done');
  await page.getByLabel('Durée réellement animée (jours)',{exact:true}).fill('0.5');
  await page.getByLabel('Durée réellement animée (heures)',{exact:true}).fill('3');
  await page.getByLabel('Apprenants effectivement formés',{exact:true}).fill('10');
  await page.getByLabel('Kilométrage total réel de la mission (km)').fill('42.5');
  await expect(page.getByLabel('Total des frais engagés',{exact:true})).toHaveText('0,00 €');
  await page.getByLabel('Difficultés rencontrées').fill('Note privée fictive');
  api.fail();await page.getByRole('button',{name:'Enregistrer le bilan',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Vos saisies sont conservées');
  await expect(page.getByLabel('Durée réellement animée (jours)',{exact:true})).toHaveValue('0.5');
  await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.getByLabel('Difficultés rencontrées')).toHaveValue('Note privée fictive');
  await page.getByRole('button',{name:'Enregistrer le bilan',exact:true}).click();await expect(page.getByText('Bilan enregistré.',{exact:true})).toBeVisible();
  expect(api.saved().private.expenses).toBe(0);expect(api.saved().report.summary).toEqual({status:'done',actual_days:0.5,actual_hours:3,learner_count:10});expect(api.saved().report.agreed_fee.amount).toBe(700);
  await page.reload();await expect(page.getByLabel('Kilométrage total réel de la mission (km)')).toHaveValue('42.5');
  await expect(page.getByLabel('Durée réellement animée (jours)',{exact:true})).toHaveValue('0.5');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/activity-form-${width}.png`,fullPage:true});
  await page.goto('/formateur/statistiques');
  const metric=title=>page.locator('.activity-metrics article').filter({has:page.locator('span',{hasText:title})}).locator('strong');
  await expect(metric('Heures réellement animées')).toHaveText('3');await expect(metric('Apprenants effectivement formés')).toHaveText('10');await expect(metric('Jours réellement animés')).toHaveText('0.5');await expect(metric('Sessions')).toHaveText('1');
  await expect(page.getByRole('heading',{name:'À compléter · 0 mission(s)'})).toBeVisible();
  await page.screenshot({path:`test-results/activity-statistics-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Activité à venir',exact:true}).click();await expect(metric('Missions')).toHaveText('0');
  await expect(page.locator('.activity-metrics')).not.toContainText(/Heures|Apprenants|Participations/);expect(api.sends()).toBe(0);
});
test('assigned mission exposes shared fields only in OF UI (API simulated)',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-12T10:00:00Z'));const api=await fixture(page,'organization');
  await page.goto(`/formateur/missions/${id}`);await expect(page.getByText('Visible par l’OF commanditaire',{exact:true})).toBeVisible();
  await page.getByLabel('Observations partagées avec l’OF').fill('Observation partagée fictive');await page.getByLabel('Difficultés rencontrées').fill('Secret formateur fictif');
  await page.getByRole('button',{name:'Enregistrer le bilan'}).click();await expect(page.getByText('Bilan enregistré.',{exact:true})).toBeVisible();expect(api.saved().report).not.toHaveProperty('difficulties');expect(api.sends()).toBe(0);
});
test('organization sees read-only report and never requests private endpoint (API simulated)',async({page})=>{
  const api=await fixture(page,'organization',true);api.seed({report:{id:'r',trainer_name:'Alex Démo',mission_id:id,agreed_fee:{amount:700},declared_fee:650,tax_basis:'HT',observations:'Observation partagée fictive',report_mode:'simple',formation_title:'SST fictive',summary:{status:'done',learner_count:10,actual_days:0.5,actual_hours:3},sessions:[{id:'s',formation:'SST fictive',group_label:'Matin',learner_count:10,expected_learners:null,days:[{date:'2026-11-01',status:'done',actual_hours:7,planned_hours:null}]}],updated_at:'2026-11-12T09:00:00Z'},private:{difficulties:'Secret formateur fictif'}});
  await page.goto(`/missions/${id}`);await expect(page.getByRole('heading',{name:'Bilans des formateurs',exact:true})).toBeVisible();
  const panel=page.getByRole('region',{name:'Bilans des formateurs'});await expect(panel.getByRole('heading',{name:'Bilan de Alex Démo'})).toBeVisible();await expect(panel).toContainText('Observation partagée fictive');await expect(panel).not.toContainText('Secret formateur fictif');await expect(panel).toContainText('0.5 jours · 3 heures');await expect(panel).not.toContainText(/Effectif prévu|Durée prévue/);await expect(panel.locator('input,textarea,button')).toHaveCount(0);expect(api.privateReads()).toBe(0);expect(api.sends()).toBe(0);
  await page.screenshot({path:'test-results/activity-of-readonly.png',fullPage:true});
});

test('completed retained report opens and remains editable after assignment disappears (API simulated)',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-12T10:00:00Z'));const api=await fixture(page,'organization');
  api.seed({report:{id:'report',trainer_name:'Alex Démo',mission_id:id,revision:1,agreed_fee:{amount:700},declared_fee:null,tax_basis:null,observations:'Bilan historique fictif',report_mode:'detailed',formation_title:'SST fictive conservée',reference_dates:['2026-11-01'],activity_date:'2026-11-01',sessions:[{id:'00000000-0000-4000-8000-000000000061',formation:'SST fictive conservée',group_label:'',learner_count:10,expected_learners:null,days:[{date:'2026-11-01',status:'done',actual_hours:7,planned_hours:null}]}],updated_at:'2026-11-12T09:00:00Z'},private:{expense_items:[],expenses:null,kilometers:null,expense_details:'',difficulties:''}});api.retain();
  await page.goto('/formateur/statistiques');await expect(page.getByRole('heading',{name:'À compléter · 0 mission(s)'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Bilans conservés · 1'})).toBeVisible();
  await page.getByRole('link',{name:'SST fictive conservée',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Bilan conservé',exact:true})).toBeVisible();
  await expect(page.getByLabel('Durée réellement animée (heures)',{exact:true})).toHaveValue('7');await expect(page.getByLabel('Durée réellement animée (jours)',{exact:true})).toHaveValue('');await page.getByLabel('Durée réellement animée (jours)',{exact:true}).fill('1');await page.getByLabel('Observations partagées avec l’OF').fill('Correction historique fictive');await page.getByRole('button',{name:'Enregistrer le bilan'}).click();await expect(page.getByText('Bilan enregistré.',{exact:true})).toBeVisible();
  expect(api.saved().report.observations).toBe('Correction historique fictive');expect(api.sends()).toBe(0);
});

test('historical multiple groups keep their actuals and cannot add groups (API simulated)',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-14T10:00:00Z'));const api=await fixture(page);
  const sessions=[1,2].map(n=>({id:`group-${n}`,formation:'SST fictive',group_label:`Groupe ${n}`,learner_count:8,expected_learners:10,days:[{date:'2026-11-01',status:'done',actual_hours:3,planned_hours:4}]}));
  api.seed({report:{id:'report',revision:1,report_mode:'detailed',formation_title:'SST fictive',reference_dates:['2026-11-01'],personal_mission_id:id,agreed_fee:{amount:700,unit:'mission',tax_basis:'HT'},declared_fee:700,tax_basis:'HT',observations:'',sessions},private:{expense_items:[],expenses:null,kilometers:null,expense_details:'',difficulties:''}});
  await page.goto(`/formateur/missions/personnelles/${id}`);const panel=page.locator('#bilan');
  await expect(panel).toContainText('Ce bilan historique comporte plusieurs groupes');await expect(panel.getByRole('button',{name:/Ajouter.*(?:groupe|session)|Retirer/})).toHaveCount(0);await expect(panel.getByRole('textbox',{name:/Formation|groupe/})).toHaveCount(0);await expect(panel).not.toContainText(/Effectif prévu|Durée pédagogique prévue/);
  await page.getByLabel('Apprenants effectivement formés — groupe 2',{exact:true}).fill('9');
  await page.getByRole('button',{name:'Enregistrer le bilan',exact:true}).click();await expect(page.getByText('Bilan enregistré.',{exact:true})).toBeVisible();expect(api.saved().report.sessions).toHaveLength(2);expect(api.saved().report.sessions[1].learner_count).toBe(9);expect(api.saved().report.sessions[0]).toEqual(sessions[0]);
  await page.screenshot({path:'test-results/activity-legacy-groups.png',fullPage:true});
});
