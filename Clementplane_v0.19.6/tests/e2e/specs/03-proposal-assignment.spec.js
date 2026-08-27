import { test, expect } from '@playwright/test';
import { loginAsOrganization, loginAsTrainer, logout } from '../support/auth.js';
import { E2E_MISSION_TITLE, futureIsoDate } from '../support/testData.js';

async function createProposalWithoutEmail(page) {
  await loginAsOrganization(page);
  await page.goto('/missions/new');
  await page.locator('input[name="client"]').fill('Client E2E');
  await page.locator('input[name="intitule"]').fill(E2E_MISSION_TITLE);
  await page.locator('input[name="formation"]').fill('Formation E2E');
  await page.locator('input[name="code_postal"]').fill('77500');
  await page.locator('input[name="ville"]').fill('Chelles');
  await page.locator('input[name="date"]').first().fill(futureIsoDate(21));
  await page.getByRole('button', { name: /Créer la mission/i }).click();
  const missionUrl = page.url();
  await page.getByRole('button', { name: /Rechercher des formateurs/i }).click();
  const candidate = page.locator('article').filter({ hasText: /E2E Formateur/i }).first();
  await candidate.getByRole('button', { name: 'Sélectionner' }).click();
  const tracked = page.locator('article').filter({ hasText: /E2E Formateur/i }).first();
  await tracked.getByRole('button', { name: 'Proposer' }).click();
  await page.getByText(/J’ai déjà contacté le formateur autrement/i).click();
  const smsLabel = page.getByText(/J’ai envoyé un SMS au formateur/i);
  await smsLabel.click();
  await page.getByRole('button', { name: /Enregistrer/i }).last().click();
  return missionUrl;
}

test('formateur : répondre puis OF : affecter', async ({ page }) => {
  const missionUrl = await createProposalWithoutEmail(page);
  await logout(page);

  await loginAsTrainer(page);
  await page.goto('/formateur/propositions');
  const proposal = page.locator('article').filter({ hasText: E2E_MISSION_TITLE }).first();
  await expect(proposal).toBeVisible();
  const open = proposal.getByRole('button', { name: /Voir|Détails|Répondre/i });
  if (await open.count()) await open.first().click();
  await page.getByRole('button', { name: /Accepter/i }).first().click();
  await expect(page.getByText(/accept/i).first()).toBeVisible();

  await logout(page);
  await loginAsOrganization(page);
  await page.goto(missionUrl);
  const row = page.locator('article').filter({ hasText: /E2E Formateur/i }).first();
  await row.getByRole('button', { name: 'Affecter' }).click();
  await page.getByText(/J’ai déjà contacté le formateur autrement/i).click().catch(() => {});
  const phone = page.getByText(/J’ai appelé le formateur/i);
  if (await phone.count()) await phone.click();
  const confirm = page.getByRole('button', { name: /Affecter|Enregistrer/i });
  await confirm.last().click();
  await expect(row.getByRole('button', { name: /Désaffecter/i })).toBeVisible();
});
