import { test, expect } from '@playwright/test';
import { createHmac, randomUUID } from 'node:crypto';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAFElEQVR4nGNkYGhggAEmBiSAmwMAGYQAiDr6p20AAAAASUVORK5CYII=',
  'base64',
);
const dossier = '/formateur/dossier';

test.use({ trace: 'off', video: 'off', screenshot: 'off' });
test.skip(process.env.DOSSIER_BROWSER_FIXTURE !== '1', 'Instance de recette isolée requise.');

function account(name) {
  const email = process.env['DOSSIER_TEST_' + name + '_EMAIL'];
  const password = process.env['DOSSIER_TEST_' + name + '_PASSWORD'];
  if (!email || !password) throw new Error('Compte de recette manquant : ' + name);
  return { email, password };
}

async function login(page, name, destination = dossier) {
  const { email, password } = account(name);
  await page.goto(destination);
  await expect(page).toHaveURL(/\/connexion(?:\?|$)/);
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[autocomplete=current-password]').fill(password);
  const tokenResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/auth/v1/token' &&
      url.searchParams.get('grant_type') === 'password' &&
      response.request().method() === 'POST';
  });
  await page.getByRole('button', { name: 'Se connecter' }).click();
  expect((await tokenResponse).status()).toBe(200);
  await expect(page).toHaveURL((url) => url.pathname === destination);
}

test('connexion, dépôt, consultation et séparation de deux dossiers', async ({ page, browser, baseURL }, testInfo) => {
  const title = 'Attestation de recette ' + randomUUID().slice(0, 8);
  await login(page, 'OWNER');
  await page.getByRole('button', { name: 'Déposer un document' }).click();
  await page.getByLabel('Intitulé').fill(title);
  await page.getByLabel(/Fichier PDF/).setInputFiles({
    name: 'temoin.png', mimeType: 'image/png', buffer: png,
  });
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByText('Document enregistré.')).toBeVisible();
  await page.reload();
  const entry = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: title }) });
  await expect(entry.getByText(/· Privé/)).toBeVisible();
  await entry.getByText('Gérer le document').click();
  await entry.getByRole('button', { name: 'Consulter' }).click();
  const preview = entry.getByRole('img', { name: title + ' · page 1' });
  await expect(preview).toHaveJSProperty('naturalWidth', 4);
  await expect(preview).toHaveJSProperty('naturalHeight', 4);
  const downloadEvent = page.waitForEvent('download');
  await entry.getByRole('button', { name: 'Télécharger' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe(title + '.png');
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  expect(bytes.subarray(0, 8)).toEqual(png.subarray(0, 8));
  expect(bytes.readUInt32BE(16)).toBe(4);
  expect(bytes.readUInt32BE(20)).toBe(4);
  await page.screenshot({ path: testInfo.outputPath('dossier-proprietaire.png') });

  const reconnected = await browser.newContext({ baseURL });
  try {
    const owner = await reconnected.newPage();
    await login(owner, 'OWNER');
    await expect(owner.getByRole('heading', { name: title })).toBeVisible();
  } finally {
    await reconnected.close();
  }

  const other = await browser.newContext({ baseURL });
  try {
    const second = await other.newPage();
    await login(second, 'OTHER');
    await expect(second.getByText(/Vous pouvez conserver ici les pièces/)).toBeVisible();
    await expect(second.getByRole('heading', { name: title })).toHaveCount(0);
  } finally {
    await other.close();
  }
});

test('un OF connecté peut télécharger la pièce partagée puis perd cet accès dès la révocation', async ({ page, browser, baseURL }) => {
  test.skip(!process.env.DOSSIER_TEST_OF_EMAIL, 'Compte gestionnaire OF de recette requis.');
  const inbox = '/dossiers-recus';
  const title = 'Pièce pour organisme ' + randomUUID().slice(0, 8);
  const recipientContext = await browser.newContext({ baseURL });
  try {
    const recipient = await recipientContext.newPage();
    await login(recipient, 'OF', inbox);
    const emptyInbox = recipient.getByText('Aucun dossier partagé avec votre organisme.');
    await expect(emptyInbox).toBeVisible();

    await login(page, 'OWNER');
    await page.getByRole('button', { name: 'Déposer un document' }).click();
    await page.getByLabel('Intitulé').fill(title);
    await page.getByLabel(/Fichier PDF/).setInputFiles({
      name: 'temoin.png', mimeType: 'image/png', buffer: png,
    });
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await expect(page.getByText('Document enregistré.')).toBeVisible();
    const entry = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: title }) });
    await entry.getByText('Gérer le document').click();
    const getBytes = async (tab, row) => {
      const pending = tab.waitForEvent('download');
      await row.getByRole('button', { name: 'Télécharger' }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe(title + '.png');
      const chunks = [];
      for await (const chunk of await download.createReadStream()) chunks.push(chunk);
      return Buffer.concat(chunks);
    };
    const original = await getBytes(page, entry);
    await page.getByRole('button', { name: 'Nouveau partage' }).click();
    await expect(page.getByRole('combobox', { name: 'Organisme', exact: true })).toBeVisible();
    await page.getByRole('checkbox', { name: title }).check();
    await page.getByRole('button', { name: 'Vérifier le partage' }).click();
    await page.getByRole('button', { name: 'Confirmer et inviter' }).click();
    const share = page.getByRole('listitem').filter({ hasText: title })
      .filter({ has: page.getByText('Gérer cet accès') });
    await expect(share).toBeVisible();

    await recipient.reload();
    await recipient.getByRole('button', { name: 'Voir les documents' }).click();
    const received = recipient.getByRole('listitem').filter({ hasText: title });
    expect(await getBytes(recipient, received)).toEqual(original);

    await share.getByText('Gérer cet accès').click();
    page.once('dialog', (dialog) => dialog.accept());
    await share.getByRole('button', { name: 'Révoquer' }).click();
    await expect(page.getByText('Accès mis à jour.')).toBeVisible();
    const freshRequest = recipient.waitForResponse((res) =>
      res.request().method() === 'POST' && new URL(res.url()).pathname === '/v1/file');
    await received.getByRole('button', { name: 'Télécharger' }).click();
    expect((await freshRequest).status()).toBe(404);
    await expect(recipient.getByRole('alert')).toBeVisible();
    await recipient.reload();
    await expect(emptyInbox).toBeVisible();
  } finally {
    await recipientContext.close();
  }
});

// RFC 6238, secret Base32 fourni à l'inscription du facteur de recette.
function authenticatorCode(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret.replace(/=+$/, '').toUpperCase()]
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, '0')).join('');
  const key = Buffer.from(bits.match(/[01]{8}/g).map((byte) => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac('sha1', key).update(counter).digest();
  const value = digest.readUInt32BE(digest[digest.length - 1] & 15) & 0x7fffffff;
  return String(value % 1000000).padStart(6, '0');
}

test('second facteur obligatoire pour un formateur administrateur', async ({ page }) => {
  await login(page, 'ADMIN');
  await expect(page.getByRole('alert')).toContainText('Second facteur requis');
  await expect(page.getByRole('button', { name: 'Déposer un document' })).toHaveCount(0);
  const enrollment = page.waitForResponse((r) =>
    new URL(r.url()).pathname === '/auth/v1/factors' && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Vérifier mon second facteur' }).click();
  const response = await enrollment;
  expect(response.ok()).toBe(true);
  const { totp } = await response.json();
  await expect(page.getByAltText("QR code personnel d’inscription")).toBeVisible();
  await page.getByLabel('Code à six chiffres').fill(authenticatorCode(totp.secret));
  await page.getByRole('button', { name: 'Vérifier le code' }).click();
  await expect(page.getByRole('button', { name: 'Déposer un document' })).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Vous pouvez conserver ici les pièces/)).toBeVisible();
});
