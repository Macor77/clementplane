import { test, expect } from '@playwright/test';
import { loginAsOrganization } from '../support/auth.js';
import { E2E_MISSION_TITLE, E2E_TRAINER_LAST_NAME, futureIsoDate } from '../support/testData.js';

test('OF : créer une mission puis proposer sans envoyer d’e-mail', async ({ page }) => {
  await loginAsOrganization(page);
  await page.getByRole('link', { name: /Créer une mission/i }).click();

  await page.locator('input[name="client"]').fill('Client E2E');
  await page.locator('input[name="intitule"]').fill(E2E_MISSION_TITLE);
  await page.locator('input[name="formation"]').fill('Formation E2E');
  await page.locator('input[name="code_postal"]').fill('77500');
  await page.locator('input[name="ville"]').fill('Chelles');
  await page.locator('input[name="date"]').first().fill(futureIsoDate(14));
  await page.getByRole('button', { name: /Créer la mission/i }).click();

  await expect(page).toHaveURL(/\/missions\/[0-9a-f-]+/i);
  await expect(page.getByText(E2E_MISSION_TITLE).first()).toBeVisible();

  await page.getByRole('button', { name: /Rechercher des formateurs/i }).click();
  const trainerRow = page.locator('article').filter({ hasText: E2E_TRAINER_LAST_NAME }).first();
  await expect(trainerRow).toBeVisible();
  await trainerRow.getByRole('button', { name: 'Sélectionner' }).click();

  const followRow = page.locator('article').filter({ hasText: E2E_TRAINER_LAST_NAME }).first();
  await followRow.getByRole('button', { name: 'Proposer' }).click();
  await page.getByText(/J’ai déjà contacté le formateur autrement/i).click();
  await page.getByLabel(/SMS/i).check().catch(async () => {
    const sms = page.getByText(/J’ai envoyé un SMS au formateur/i);
    await sms.click();
  });
  await page.getByRole('button', { name: /Enregistrer/i }).last().click();
  await expect(page.getByText(/Proposition enregistrée/i)).toBeVisible();
});
