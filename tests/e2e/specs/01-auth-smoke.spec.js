import { test, expect } from '@playwright/test';
import { loginAsOrganization, loginAsTrainer, logout } from '../support/auth.js';

test('un OF E2E peut se connecter', async ({ page }) => {
  await loginAsOrganization(page);
  await expect(page.getByRole('heading', { name: /Missions/i }).first()).toBeVisible();
});

test('un formateur E2E peut se connecter', async ({ page }) => {
  await loginAsTrainer(page);
  await expect(page.getByText(/ESPACE FORMATEUR/i)).toBeVisible();
  await logout(page);
});
