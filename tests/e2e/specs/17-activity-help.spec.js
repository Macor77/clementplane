import { test, expect } from '@playwright/test';
import { fixture, id } from '../support/activity-fixture';

const help = (page, title) => page.getByRole('button', { name: `Aide : ${title}`, exact: true });
const dialog = (page, title) => page.getByRole('dialog', { name: title, exact: true });

for (const width of [1440, 768, 390]) test(`activity help ${width}px — guidance, dismissal, draft and save (API simulated)`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00Z'));
  const api = await fixture(page);
  await page.goto(`/formateur/missions/personnelles/${id}`);
  const panel = page.locator('#bilan');
  await expect(panel.getByText('Privé — vous uniquement', { exact: true })).toHaveCount(2);
  await expect(panel.getByText('Le nombre d’apprenants effectivement formés inclut les personnes partiellement formées.', { exact: true })).toBeVisible();
  await expect(panel).not.toContainText('Une mission correspond à une session');
  await expect(panel).not.toContainText('La distance indicative');
  await expect(panel).not.toContainText('Le bilan ne modifie pas le contrat');
  await page.screenshot({ path: `test-results/activity-compact-${width}.png`, fullPage: true });

  const sections = [
    ['Bilan de la mission', ['une session et un seul groupe', 'une ou plusieurs journées', 'Les champs vides restent « Non renseigné »']],
    ['Bilan personnel et tarif déclaré', ['Ce bilan reste privé, même si le donneur d’ordre figure dans Mes OF.', 'Aucun e-mail ni notification n’est envoyé.', 'Le bilan ne modifie pas le contrat et ne vaut ni facture ni acceptation du montant par l’OF.']],
    ['Réalisation de la formation', ['2 jours et 14 heures', '0,5 jour et 3 heures', 'Aucune conversion automatique.', 'Comptez chaque apprenant une seule fois, sans saisir son identité.', 'inclut les personnes partiellement formées']],
    ['Confidentialité des informations privées', ['Ces informations ne sont accessibles à aucun OF et ne sont pas ajoutées aux agendas.', 'Vos dépenses, votre kilométrage réel et vos difficultés restent accessibles uniquement par vous.']],
    ['Frais engagés', ['Ajoutez vos dépenses, puis enregistrez le bilan.', 'Une même catégorie peut être utilisée plusieurs fois.', 'sauf pour « Autres frais »', 'Le total est calculé automatiquement', 'Les lignes entièrement vides ne sont pas comptabilisées.']],
    ['Kilométrage réel', ['Incluez tous vos déplacements, allers et retours.', 'La distance indicative de Clementplane est à vol d’oiseau', 'ne permet pas de préremplir ce kilométrage routier', 'Aucune conversion en frais.']],
  ];
  for (const [title, texts] of sections) {
    const trigger = help(page, title);
    const target = await trigger.boundingBox();
    expect(target.width).toBeGreaterThanOrEqual(44); expect(target.height).toBeGreaterThanOrEqual(44);
    await trigger.click();
    const modal = dialog(page, title);
    for (const text of texts) await expect(modal).toContainText(text);
    await expect(modal.getByRole('button', { name: 'Fermer' })).toBeFocused();
    const bounds = await modal.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y).toBeGreaterThanOrEqual(0); expect(bounds.y + bounds.height).toBeLessThanOrEqual(1001);
    if (width === 390) expect(Math.abs(bounds.y + bounds.height - 1000)).toBeLessThanOrEqual(1);
    await modal.getByRole('button', { name: 'Fermer' }).click();
    await expect(modal).not.toBeVisible(); await expect(trigger).toBeFocused();
  }
  // Help does not submit or mark an untouched form as modified.
  expect(api.saved()).toBeNull();
  await expect(page.getByText('Modifications non enregistrées.', { exact: true })).not.toBeVisible();
  await help(page, 'Bilan de la mission').click(); await page.keyboard.press('Escape');
  await expect(help(page, 'Bilan de la mission')).toBeFocused();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await help(page, 'Bilan de la mission').click(); await page.mouse.click(4, 4);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');

  await page.getByRole('combobox', { name: 'Formation réalisée', exact: true }).selectOption('done');
  await page.getByLabel('Apprenants effectivement formés', { exact: true }).fill('4');
  await page.getByLabel('Durée réellement animée (jours)', { exact: true }).fill('0.5');
  await page.getByLabel('Durée réellement animée (heures)', { exact: true }).fill('3');
  await page.getByLabel('Observations sur la mission (privées)').fill('Observation fictive conservée');
  await page.getByLabel('Kilométrage total réel de la mission (km)').fill('42');
  await page.getByLabel('Difficultés rencontrées').fill('Difficulté fictive conservée');
  await panel.getByRole('button', { name: '+ Ajouter une dépense' }).click();
  await page.getByLabel('Catégorie de dépense 1', { exact: true }).selectOption('meals');
  await page.getByLabel('Montant de la dépense 1 (€)', { exact: true }).fill('12,50');
  const partial = panel.locator('details.activity-partial-attendance');
  await expect(partial).not.toHaveAttribute('open', '');
  await partial.locator('summary').click();
  await partial.getByRole('button', { name: '+ Ajouter une ligne' }).click();
  await partial.getByLabel('Nombre d’apprenants partiellement formés — ligne 1').fill('1');
  await partial.getByLabel('Durée suivie en heures — ligne 1').fill('1');
  await help(page, 'Apprenants partiellement formés').click();
  const modal = dialog(page, 'Apprenants partiellement formés');
  for (const text of ['Ne les ajoutez pas une deuxième fois.', 'Une ligne regroupe les personnes ayant suivi la même durée.', '1 apprenant pendant 1 heure, puis 3 apprenants pendant 3 heures.', 'sans la multiplier par l’effectif.', 'sans conversion automatique.', 'Au moins une durée est nécessaire pour chaque ligne.', 'Ces durées ne s’ajoutent pas au temps animé par le formateur.']) await expect(modal).toContainText(text);
  await page.screenshot({ path: `test-results/activity-help-${width}.png` });
  // Native modal keeps keyboard navigation inside the help, including scrollable text.
  await page.keyboard.press('Tab'); await expect(modal.locator('.activity-help-body')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(modal.getByRole('button', { name: 'Fermer' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(help(page, 'Apprenants partiellement formés')).toBeFocused();
  await expect(partial).toHaveAttribute('open', '');
  await expect(partial.getByLabel('Durée suivie en heures — ligne 1')).toHaveValue('1');
  await expect(page.getByText('Modifications non enregistrées.', { exact: true })).toBeVisible();
  expect(api.saved()).toBeNull();
  api.fail(); await page.getByRole('button', { name: 'Enregistrer le bilan', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Vos saisies sont conservées');
  await help(page, 'Frais engagés').click(); await page.keyboard.press('Escape');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Enregistrer le bilan', exact: true }).click();
  await expect(page.getByText('Bilan enregistré.', { exact: true })).toBeVisible();
  expect(api.saved().report.summary.learner_count).toBe(4);
  expect(api.saved().report.partial_attendance[0].actual_hours).toBe(1);
  expect(api.saved().report.observations).toBe('Observation fictive conservée');
  expect(api.saved().private.expenses).toBe(12.5);
  expect(api.saved().private.kilometers).toBe(42);
  expect(api.saved().private.difficulties).toBe('Difficulté fictive conservée');
  await page.reload();
  await expect(page.getByLabel('Montant de la dépense 1 (€)', { exact: true })).toHaveValue('12.50');
  await expect(page.getByLabel('Kilométrage total réel de la mission (km)')).toHaveValue('42');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(api.sends()).toBe(0);
});

test('assigned trainer help explains sharing without hiding the visible badge (API simulated)', async ({ page }) => {
  const api = await fixture(page, 'organization');
  await page.goto(`/formateur/missions/${id}`);
  await expect(page.getByText('Visible par l’OF commanditaire', { exact: true })).toBeVisible();
  await expect(page.getByText('Privé — vous uniquement', { exact: true })).toBeVisible();
  await help(page, 'Partage et tarif déclaré').click();
  await expect(dialog(page, 'Partage et tarif déclaré')).toContainText('consultables par l’OF dès l’enregistrement réussi');
  await expect(dialog(page, 'Partage et tarif déclaré')).toContainText('Lui seul peut les consulter avec vous ; il ne peut pas les modifier.');
  await expect(dialog(page, 'Partage et tarif déclaré')).toContainText('Aucun e-mail ni notification n’est envoyé.');
  await page.keyboard.press('Escape'); expect(api.saved()).toBeNull(); expect(api.sends()).toBe(0);
});

test('short touch viewport — scrollable bottom help and reachable close (API simulated)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 480 }, isMobile: true, hasTouch: true });
  const mobile = await context.newPage();
  await fixture(mobile);
  await mobile.goto(`/formateur/missions/personnelles/${id}`);
  await mobile.locator('details.activity-partial-attendance > summary').tap();
  await help(mobile, 'Apprenants partiellement formés').tap();
  const modal = dialog(mobile, 'Apprenants partiellement formés');
  const body = modal.locator('.activity-help-body');
  expect(await body.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(body.getByText(/Au moins une durée est nécessaire/)).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Fermer' })).toBeInViewport();
  await mobile.screenshot({ path: 'test-results/activity-help-small-mobile.png' });
  await modal.getByRole('button', { name: 'Fermer' }).tap();
  await expect(modal).not.toBeVisible();
  // Navigating away while help is open also restores body scrolling.
  await help(mobile, 'Bilan de la mission').tap();
  await mobile.evaluate(() => { window.history.pushState({}, '', '/formateur/statistiques'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await expect(mobile.locator('#bilan')).toHaveCount(0);
  expect(await mobile.evaluate(() => document.body.style.overflow)).toBe('');
  await context.close();
});
