import { test, expect } from '@playwright/test';
import { fixture } from '../support/activity-fixture';

async function statisticsFixture(page) {
  const api = await fixture(page);
  const owner = '20000000-0000-0000-0000-000000000001';
  const missions = Array.from({ length: 11 }, (_, i) => ({ id: `mission-${i + 1}`, title: `Client fictif ${i + 1}`, formation: i === 1 ? 'EPI fictive' : 'SST fictive', client_name: i === 1 ? 'Autre OF fictif' : 'OF Démo',
    status: 'confirmed', fee: 900, fee_unit: 'mission', dates: [{ date: `2026-11-${String(i === 10 ? 20 : i + 1).padStart(2, '0')}` }, { date: `2026-11-${String(i === 10 ? 21 : i + 2).padStart(2, '0')}` }] }));
  missions.push({ ...missions[0], id: 'previous', dates: [{ date: '2026-10-01' }] });
  const reports = [0, 1, 2, 3, 11].map(i => ({ id: `report-${i}`, personal_mission_id: missions[i].id, report_mode: 'simple', sessions: [], formation_title: missions[i].formation, reference_dates: missions[i].dates.map(d => d.date), activity_date: missions[i].dates[0].date,
    summary: { status: 'done', learner_count: 4, actual_days: 0.5, actual_hours: i === 3 ? null : 3.5 }, partial_attendance: [{ learner_count: 1, actual_hours: 1 }], declared_fee: ({ 0: 100.10, 1: 200, 2: 0, 3: null, 11: 50 })[i], tax_basis: i === 1 ? 'TTC' : 'HT', revision: 1 }));
  const expenses = reports.map(r => ({ report_id: r.id, expense_items: r.id === 'report-0' ? [{ id: 'e1', category: 'meals', amount_cents: 10, details: 'Repas fictif A' }, { id: 'e2', category: 'meals', amount_cents: 20, details: 'Repas fictif B' }, { id: 'e3', category: 'accommodation', amount_cents: 2500, details: '' }] : r.id === 'report-1' ? [{ id: 'e4', category: 'fuel', amount_cents: 3000, details: '' }] : [] }));
  let goal = null, failPrivate = false, failGoal = false;
  const privateQueries = [];
  await page.route('https://example.supabase.co/rest/v1/**', async route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname; let data;
    if (path.endsWith('/trainer_personal_missions')) data = missions;
    else if (path.endsWith('/trainer_activity_reports')) data = reports;
    else if (path.endsWith('/trainer_activity_private')) {
      privateQueries.push(url.search);
      if (failPrivate) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'simulated network failure' }) });
      data = expenses;
    } else if (path.endsWith('/trainer_activity_goals')) {
      if (failGoal && req.method() !== 'GET') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'simulated network failure' }) });
      if (req.method() === 'POST') { const payload = req.postDataJSON(); expect(payload.owner_user_id).toBe(owner); goal = { month: payload.month, metric: payload.metric, target: payload.target }; }
      if (req.method() === 'DELETE') { expect(url.searchParams.get('owner_user_id')).toBe(`eq.${owner}`); goal = null; }
      data = goal;
    } else return route.fallback();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  return { ...api, queries: () => privateQueries, goal: () => goal, failPrivate: value => { failPrivate = value; }, failGoal: value => { failGoal = value; } };
}

for (const width of [320, 390, 768, 1440]) test(`statistics ${width}px — realized money, expense drilldown, help and pending rows (API simulated)`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.clock.setFixedTime(new Date('2026-11-17T10:00:00Z'));
  const api = await statisticsFixture(page); await page.goto('/formateur/statistiques');
  const revenue = page.getByRole('button', { name: 'Voir le détail : Chiffre d’affaires réalisé', exact: true });
  await expect(revenue).toContainText('100,10 € HT'); await expect(revenue).toContainText('200,00 € TTC');
  const cost = page.getByRole('button', { name: 'Voir le détail : Total des frais engagés', exact: true });
  await expect(cost).toContainText('55,30 €');
  await expect(page.getByText('Les frais n’ont pas de date propre', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Aide : Total des frais engagés', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Les frais n’ont pas de date propre'); await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Aide : Total des frais engagés', exact: true })).toBeFocused();
  await cost.click(); await expect(page.getByRole('dialog')).toHaveAccessibleName('Répartition des frais engagés');
  await expect(page.getByRole('dialog')).toContainText('55,30 €');
  await page.screenshot({ path: `test-results/statistics-expenses-${width}.png` });
  await page.getByRole('dialog').getByRole('button', { name: /^Repas/ }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Repas');
  await expect(page.getByRole('dialog')).toContainText('Repas fictif A'); await expect(page.getByRole('dialog')).toContainText('Repas fictif B');
  await expect(page.getByRole('dialog').locator('.statistics-expense-lines li')).toHaveCount(2);
  await page.getByRole('button', { name: 'Toutes les catégories', exact: false }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Fermer ×' }).click(); await expect(cost).toBeFocused();
  await page.getByRole('button', { name: '1 montant(s) à renseigner' }).click();
  await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(1); await page.keyboard.press('Escape');
  const pending = page.locator('.activity-pending'); await expect(pending.locator('li')).toHaveCount(5);
  await expect(pending.locator('li').first()).toContainText('Fin : 05/11/2026');
  await expect(pending.locator('li').first()).toContainText('Durée en heures'); await expect(pending.locator('li').first()).toContainText('Montant');
  await pending.getByRole('button', { name: 'Tout voir (7)' }).click(); await expect(pending.locator('li')).toHaveCount(7);
  await pending.getByRole('button', { name: 'Réduire la liste' }).click();
  await page.screenshot({ path: `test-results/statistics-dashboard-${width}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(api.queries().every(query => query.includes('owner_user_id=eq.20000000-0000-0000-0000-000000000001') && !/kilometer|difficult/.test(query))).toBe(true);
  expect(api.sends()).toBe(0);
});

test('filters and periods update totals, detail lists, chart and future without classifying planned fees as revenue', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-17T10:00:00Z')); await statisticsFixture(page); await page.goto('/formateur/statistiques');
  await page.locator('.statistics-filters summary').click(); await page.getByLabel('Donneur d’ordre / OF').selectOption('Autre OF fictif');
  const revenue = page.getByRole('button', { name: 'Voir le détail : Chiffre d’affaires réalisé', exact: true });
  await expect(revenue).toContainText('200,00 € TTC'); await expect(revenue).not.toContainText('HT');
  await expect(page.getByRole('button', { name: 'Voir le détail : Total des frais engagés', exact: true })).toContainText('30,00 €');
  await revenue.click(); await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(1); await page.keyboard.press('Escape');
  await page.getByLabel('Indicateur du graphique').selectOption('TTC'); await expect(page.locator('.statistics-comparison strong')).toHaveText('200,00 € TTC');
  await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click(); await page.getByRole('button', { name: 'Mois précédent', exact: true }).click();
  await expect(revenue).toContainText('50,00 € HT');
  await page.getByRole('button', { name: 'Personnalisée', exact: true }).click(); await page.getByLabel('Début de période').fill('2026-12-31');
  await expect(page.getByRole('alert')).toContainText('période valide'); await expect(revenue).toHaveCount(0);
  await page.getByRole('button', { name: 'Ce mois-ci', exact: true }).click(); await page.getByRole('button', { name: 'Activité à venir', exact: true }).click();
  await expect(revenue).toHaveCount(0); await expect(page.getByRole('button', { name: 'Voir le détail : Tarifs convenus totalisables', exact: true })).toContainText('900,00 € HT');
});

test('monthly goal survives reload, errors preserve input, filtering does not alter progress, delete is confirmed', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-17T10:00:00Z')); const api = await statisticsFixture(page); await page.goto('/formateur/statistiques');
  const panel = page.locator('.statistics-goal'); await panel.locator('summary').click();
  await panel.getByLabel('Objectif (sessions)', { exact: true }).fill('2'); api.failGoal(true);
  await panel.getByRole('button', { name: 'Enregistrer l’objectif' }).click(); await expect(panel.getByRole('alert')).toContainText('saisie est conservée');
  await expect(panel.getByLabel('Objectif (sessions)', { exact: true })).toHaveValue('2'); expect(api.goal()).toBeNull();
  api.failGoal(false); await panel.getByRole('button', { name: 'Enregistrer l’objectif' }).click(); await expect(panel.getByRole('status')).toHaveText('Objectif enregistré.');
  await expect(panel.locator('progress')).toHaveAttribute('value', '100'); await expect(panel).toContainText('200 %');
  await page.reload(); await expect(panel).toContainText('4 / 2');
  await page.locator('.statistics-filters summary').click(); await page.getByLabel('Donneur d’ordre / OF').selectOption('Autre OF fictif'); await expect(panel).toContainText('4 / 2');
  await panel.locator('summary').click(); await panel.getByRole('button', { name: 'Supprimer l’objectif' }).click(); await expect(panel.getByRole('status')).toHaveText('Objectif supprimé.');
  expect(api.goal()).toBeNull(); await page.reload(); await expect(panel.locator('progress')).toHaveCount(0);
});

test('failed private statistics request hides financial totals and retry recovers', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-17T10:00:00Z')); const api = await statisticsFixture(page); api.failPrivate(true); await page.goto('/formateur/statistiques');
  await expect(page.getByRole('alert')).toContainText('Aucun total ne peut être confirmé'); await expect(page.locator('.activity-metrics')).toHaveCount(0);
  api.failPrivate(false); await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Voir le détail : Total des frais engagés', exact: true })).toContainText('55,30 €');
});
