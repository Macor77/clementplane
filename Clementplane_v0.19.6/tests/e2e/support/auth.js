import { expect } from '@playwright/test';
import { E2E_ORG_EMAIL, E2E_TRAINER_EMAIL } from './testData.js';

async function login(page, email, destination) {
  const password = process.env.E2E_TEST_PASSWORD;
  if (!password) throw new Error('E2E_TEST_PASSWORD manquant');

  await page.goto('/connexion');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).not.toHaveURL(/\/connexion(?:$|\?)/);
  await page.goto(destination);
  await expect(page).toHaveURL(new RegExp(destination.replaceAll('/', '\\/')));
}

export async function loginAsOrganization(page) {
  await login(page, E2E_ORG_EMAIL, '/missions');
}

export async function loginAsTrainer(page) {
  await login(page, E2E_TRAINER_EMAIL, '/formateur/espace');
}

export async function logout(page) {
  const button = page.getByRole('button', { name: /Se déconnecter/i });
  if (await button.count()) {
    await button.first().click();
    await expect(page).toHaveURL(/\/connexion/);
  } else {
    await page.goto('/connexion');
  }
}
