import { test, expect } from '@playwright/test';
import { loginAsTrainer } from '../support/auth.js';
import { futureIsoDate } from '../support/testData.js';

test('formateur : disponibilité persistée après rechargement', async ({ page }) => {
  const targetDate = futureIsoDate(35);
  await loginAsTrainer(page);
  await page.goto('/formateur/disponibilites');

  const target = page.getByTestId(`availability-day-${targetDate}`);
  if (!(await target.count())) {
    await page.getByRole('button', { name: /Mois suivant/i }).click();
  }
  const day = page.getByTestId(`availability-day-${targetDate}`);
  await expect(day).toBeVisible();
  const available = day.getByRole('button', { name: 'Disponible' });
  if (await available.isEnabled()) await available.click();
  await expect(day).toContainText('Disponible');

  await page.reload();
  const reloaded = page.getByTestId(`availability-day-${targetDate}`);
  if (!(await reloaded.count())) await page.getByRole('button', { name: /Mois suivant/i }).click();
  await expect(page.getByTestId(`availability-day-${targetDate}`)).toContainText('Disponible');
});
