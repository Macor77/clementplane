import { test, expect } from '@playwright/test';
import { fixture, id } from '../support/activity-fixture';

const oldReport = () => ({
  report: { id: 'report', revision: 1, report_mode: 'simple', personal_mission_id: id, sessions: [], formation_title: 'SST fictive', reference_dates: ['2026-11-01'], activity_date: '2026-11-01',
    summary: { status: 'done', learner_count: 4, actual_days: 0.5, actual_hours: 3.5 },
    partial_attendance: [{ id: '00000000-0000-4000-8000-000000000081', learner_count: 1, actual_days: null, actual_hours: 1 }],
    observations: 'Ancien bilan fictif', declared_fee: 700, tax_basis: 'HT', agreed_fee: { amount: 700, unit: 'mission', tax_basis: 'HT' } },
  private: { expense_items: [{ id: '00000000-0000-4000-8000-000000000091', category: 'meals', amount_cents: 1250, details: 'Frais fictif' }], kilometers: 42, difficulties: 'Note privée fictive' },
});

for (const width of [1440, 390]) test(`separate attendance ${width}px — old total, independent counts, zero, reload and stats (API simulated)`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00Z'));
  const api = await fixture(page); api.seed(oldReport());
  const url = `/formateur/missions/personnelles/${id}`;
  await page.goto(url);
  const complete = page.getByLabel('Apprenants entièrement formés', { exact: true });
  const total = page.getByLabel('Total des participants', { exact: true });
  const details = page.locator('details.activity-partial-attendance');
  const save = async () => { await page.getByRole('button', { name: 'Enregistrer le bilan', exact: true }).click(); await expect(page.getByText('Bilan enregistré.', { exact: true })).toBeVisible(); };
  await expect(complete).toHaveValue('3'); await expect(total).toHaveText('4');
  await expect(details).not.toHaveAttribute('open', ''); await details.locator('summary').click();
  await expect(details.getByLabel('Nombre d’apprenants partiellement formés — ligne 1')).toHaveValue('1');
  await expect(details.getByLabel('Durée suivie en heures — ligne 1')).toHaveValue('1');
  await page.getByLabel('Observations sur la mission (privées)').fill('Autre champ corrigé');
  await save(); expect(api.saved().report.summary.learner_count).toBe(4);
  await page.reload(); await expect(complete).toHaveValue('3'); await expect(total).toHaveText('4');
  await details.locator('summary').click();
  await page.screenshot({ path: `test-results/separate-attendance-${width}.png`, fullPage: true });
  await page.goto('/formateur/statistiques');
  const metric = title => page.locator('.activity-metrics article').filter({ has: page.locator('span', { hasText: title }) }).locator('strong');
  await expect(metric('Apprenants entièrement formés')).toHaveText('3');
  await expect(metric('Apprenants partiellement formés')).toHaveText('1');
  await expect(metric('Total des participants')).toHaveText('4');
  await expect(metric('Heures réellement animées')).toHaveText('3.5');
  await expect(metric('Sessions')).toHaveText('1');
  await page.screenshot({ path: `test-results/separate-statistics-${width}.png`, fullPage: true });
  await page.goto(url); await details.locator('summary').click();
  await complete.fill('0');
  await details.getByRole('button', { name: '+ Ajouter une ligne', exact: true }).click();
  await details.getByLabel('Nombre d’apprenants partiellement formés — ligne 2').fill('3');
  await details.getByLabel('Durée suivie en jours — ligne 2').fill('0,25');
  await expect(total).toHaveText('4'); await save();
  expect(api.saved().report.summary.learner_count).toBe(4);
  expect(api.saved().report.partial_attendance[1].actual_hours).toBeNull();
  await page.reload(); await expect(complete).toHaveValue('0'); await details.locator('summary').click();
  await details.getByLabel('Supprimer la participation partielle 1', { exact: true }).click();
  await expect(complete).toHaveValue('0'); await expect(total).toHaveText('3'); await save();
  await complete.fill('3'); await expect(total).toHaveText('6'); await save();
  expect(api.saved().report.summary.learner_count).toBe(6);
  await page.reload(); await expect(complete).toHaveValue('3');
  expect(api.saved().private.expenses).toBe(12.5); expect(api.saved().private.kilometers).toBe(42);
  expect(api.saved().private.difficulties).toBe('Note privée fictive');
  expect(api.sends()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('organization sees complete and partial counts separately, with no private data (API simulated)', async ({ page }) => {
  const api = await fixture(page, 'organization', true);
  const data = oldReport(); data.report.mission_id = id; data.report.personal_mission_id = null; data.report.trainer_name = 'Alex Démo'; api.seed(data);
  await page.goto(`/missions/${id}`);
  const panel = page.getByRole('region', { name: 'Bilans des formateurs' });
  await expect(panel).toContainText('Apprenants entièrement formés : 3');
  await expect(panel).toContainText('Total des participants : 4');
  await panel.locator('details.activity-partial-attendance > summary').click();
  await expect(panel).toContainText('1 apprenant · Jours non renseignés · 1 heure(s)');
  await expect(panel).not.toContainText('Note privée fictive');
  await expect(panel.locator('input,textarea,button')).toHaveCount(0);
  expect(api.privateReads()).toBe(0);
});

test('historical single-group report stays unclassified when only an observation changes (API simulated)', async ({ page }) => {
  const api = await fixture(page); const data = oldReport();
  data.report.report_mode = 'detailed'; data.report.summary = null; data.report.partial_attendance = [];
  data.report.sessions = [{ id: '00000000-0000-4000-8000-000000000082', formation: 'SST fictive', group_label: '', learner_count: 4, expected_learners: null, days: [{ date: '2026-11-01', status: 'done', actual_hours: 3.5, planned_hours: null }] }];
  api.seed(data);
  await page.goto(`/formateur/missions/personnelles/${id}`);
  await expect(page.getByLabel('Apprenants entièrement formés', { exact: true })).toHaveValue('');
  await expect(page.locator('#bilan')).toContainText('Ancien total : 4 participant(s)');
  await page.getByLabel('Observations sur la mission (privées)').fill('Observation corrigée');
  await page.getByRole('button', { name: 'Enregistrer le bilan', exact: true }).click();
  await expect(page.getByText('Bilan enregistré.', { exact: true })).toBeVisible();
  expect(api.saved().report.report_mode).toBe('detailed');
  expect(api.saved().report.sessions).toEqual(data.report.sessions);
  await page.reload();
  await expect(page.getByLabel('Apprenants entièrement formés', { exact: true })).toHaveValue('');
  await page.getByLabel('Durée réellement animée (jours)', { exact: true }).fill('0.5');
  await page.getByRole('button', { name: 'Enregistrer le bilan', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('bilan historique');
  expect(api.saved().report.report_mode).toBe('detailed');
  await page.getByLabel('Apprenants entièrement formés', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Enregistrer le bilan', exact: true }).click();
  await expect(page.getByText('Bilan enregistré.', { exact: true })).toBeVisible();
  expect(api.saved().report.report_mode).toBe('simple');
  expect(api.saved().report.summary.learner_count).toBe(4);
  expect(api.saved().report.sessions).toEqual(data.report.sessions);
});
