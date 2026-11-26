import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fixture } from '../support/activity-fixture';
const agreementDigest = createHash('sha256')
  .update(readFileSync('docs/sprints/v1.8.0/ANNEXE_DOSSIER_PROFESSIONNEL.md'))
  .digest('hex');
const api = 'https://dossier.example.invalid/v1/';
for (const width of [390, 1440])
  test(`dossier formateur et reprise · ${width}px · API simulée`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 870 });
    await fixture(page);
    const doc = {
      id: 'doc1',
      version_id: 'version1',
      kind: 'cv',
      title: 'CV fictif',
      expiry_mode: 'unknown',
      note: 'Note fictive',
    };
    const data = { agreement: { sha256: agreementDigest, accepted_at: null }, documents: [doc], partners: [], shares: [], reminders: [] };
    const posts = [];
    await page.route(api + '**', async (route) => {
      const action = route.request().url().split('/').pop();
      if (action === 'accept-agreement') {
        expect(route.request().postDataJSON()).toEqual({ accepted: true, sha256: agreementDigest });
        data.agreement.accepted_at = '2026-11-21T18:00:00Z';
        return route.fulfill({ json: data.agreement });
      }
      if (action === 'upload') {
        posts.push(route.request().postDataJSON());
        if (posts.length === 1) {
          data.documents.push({
            id: posts[0].doc, version_id: posts[0].request, kind: 'diplome',
            title: posts[0].title, expiry_mode: 'none',
          });
          return route.abort('failed');
        }
        return route.fulfill({ json: { id: posts[0].doc } });
      }
      return route.fulfill({ json: action === 'overview' ? data : {} });
    });
    await page.goto('/formateur/dossier');
    await expect(
      page.getByRole('heading', { name: 'Mon dossier professionnel' }),
    ).toBeVisible();
    await expect(page.getByText('Échéance à renseigner · Privé')).toBeVisible();
    await page.getByRole('button', { name: 'Déposer un document' }).click();
    await expect(page.getByLabel(/Fichier PDF/)).toHaveCount(0);
    await page.getByText('Lire l’annexe de traitement des données', { exact: true }).click();
    await expect(page.getByRole('heading', { name: '1. Parties et instructions' })).toBeVisible();
    await page.getByRole('button', { name: 'Annuler' }).click();
    expect(data.agreement.accepted_at).toBeNull();
    expect(posts).toHaveLength(0);
    await page.getByRole('button', { name: 'Déposer un document' }).click();
    await page.getByRole('button', { name: 'J’accepte l’annexe du dossier professionnel' }).click();
    await page.getByLabel('Intitulé').fill('Diplôme fictif');
    await page
      .getByLabel(/Fichier PDF/)
      .setInputFiles({
        name: 'fictif.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-fixture'),
      });
    await page
      .getByRole('button', { name: 'Enregistrer', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText(
      'Connexion interrompue',
    );
    await expect(page.getByLabel('Intitulé')).toHaveValue('Diplôme fictif');
    await expect(page.getByLabel('Intitulé')).toBeDisabled();
    await expect(page.getByLabel(/Fichier PDF/)).toBeDisabled();
    await expect(page.getByText('Document enregistré.')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Réessayer le même dépôt' })
      .click();
    await expect(page.getByText('Document enregistré.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Diplôme fictif' })).toHaveCount(1);
    expect(posts[0]).toEqual(posts[1]);
    await page.getByRole('button', { name: 'Nouveau partage' }).click();
    await page
      .getByRole('textbox', { name: 'Adresse e-mail', exact: true })
      .fill('recette@example.invalid');
    await page
      .getByRole('button', { name: 'Tous les documents actuellement présents' })
      .click();
    await page.getByRole('button', { name: 'Vérifier le partage' }).click();
    await expect(page.getByText(/copies déjà téléchargées/)).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/dossier-recap-${width}.png` });
  });
test('un fichier refusé peut être corrigé et une confirmation incomplète peut être vérifiée dans le dossier', async ({ page }) => {
  await fixture(page);
  const data = {
    agreement: { sha256: agreementDigest, accepted_at: '2026-11-26T12:00:00Z' },
    documents: [], partners: [], shares: [], reminders: [],
  };
  const uploads = [];
  await page.route(api + '**', async (route) => {
    if (route.request().url().endsWith('/overview')) return route.fulfill({ json: data });
    const body = route.request().postDataJSON();
    uploads.push(body);
    if (uploads.length === 1)
      return route.fulfill({ status: 422, json: { detail: 'Le fichier a été refusé.' } });
    data.documents.push({ id: body.doc, version_id: body.request, title: body.title, kind: body.kind, expiry_mode: 'none' });
    return route.fulfill({ json: {} });
  });
  await page.goto('/formateur/dossier');
  await page.getByRole('button', { name: 'Déposer un document' }).click();
  const picker = page.getByLabel(/Fichier PDF/);
  await picker.setInputFiles({ name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from('première pièce fictive') });
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('refusé');
  await expect(picker).toBeEnabled();
  await picker.setInputFiles({ name: 'b.pdf', mimeType: 'application/pdf', buffer: Buffer.from('pièce corrigée fictive') });
  await page.getByLabel('Intitulé').fill('Attestation corrigée');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Réessayer le même dépôt' })).toBeVisible();
  await expect(page.getByText('Document enregistré.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Revenir au dossier' }).click();
  await expect(page.getByRole('heading', { name: 'Attestation corrigée' })).toBeVisible();
  expect(uploads).toHaveLength(2);
  expect(uploads[1].file).not.toBe(uploads[0].file);
});

test('un texte absent ou différent empêche un nouveau dépôt', async ({ page }) => {
  await fixture(page);
  let digest = null;
  const writes = [];
  await page.route(api + '**', async (route) => {
    const action = route.request().url().split('/').pop();
    if (action !== 'overview') writes.push(action);
    return route.fulfill({ json: {
      agreement: { sha256: digest, accepted_at: null },
      documents: [], partners: [], shares: [], reminders: [],
    } });
  });
  for (const version of [null, 'b'.repeat(64)]) {
    digest = version;
    await page.goto('/formateur/dossier');
    await page.getByRole('button', { name: 'Déposer un document' }).click();
    await expect(page.getByText(version ? /La version de l’annexe a changé/ : /après la publication/)).toBeVisible();
    await expect(page.getByRole('button', { name: /J’accepte/ })).toHaveCount(0);
    await expect(page.getByLabel(/Fichier PDF/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Annuler' }).click();
  }
  expect(writes).toEqual([]);
});

test('invité isolé, octets hors cache et aucun accès OF en écriture · API simulée', async ({
  page,
}) => {
  const calls = [];
  await page.route(api + '**', async (r) => {
    const action = r.request().url().split('/').pop();
    calls.push(action);
    if (action === 'guest-file')
      return r.fulfill({
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+cR9sAAAAASUVORK5CYII=',
          'base64',
        ),
        headers: { 'cache-control': 'no-store' },
      });
    return r.fulfill({
      json:
        action === 'verify-code'
          ? { session: 'ticket-fictif' }
          : action === 'guest-list'
            ? [
                {
                  id: 'd',
                  version_id: 'v',
                  title: 'Attestation fictive',
                  expiry_mode: 'none',
                },
              ]
            : {},
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  // Install the built worker, so CacheStorage assertions exercise an active PWA.
  await page.goto('/dossier-invite.html');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.goto('about:blank');
  await page.goto('/dossier-invite.html#invitation-fictive');
  await expect(page.getByRole('button', { name: 'Télécharger' })).toHaveCount(
    0,
  );
  expect(new URL(page.url()).hash).toBe('');
  expect(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  ).toBe(true);
  await page.getByRole('button', { name: 'Demander mon code' }).click();
  await page.getByLabel('Code reçu par e-mail').fill('12345678');
  await page.getByRole('button', { name: 'Ouvrir le dossier' }).click();
  await page.getByRole('button', { name: 'Consulter' }).click();
  await expect(
    page.getByRole('img', { name: /Attestation fictive/ }),
  ).toBeVisible();
  expect(calls).toEqual([
    'request-code',
    'verify-code',
    'guest-list',
    'guest-file',
  ]);
  expect(
    await page.evaluate(async () => {
      for (const name of await caches.keys()) {
        if (
          (await (await caches.open(name)).keys()).some((r) =>
            r.url.includes('/v1/'),
          )
        )
          return false;
      }
      return true;
    }),
  ).toBe(true);
  await fixture(page, 'organization', true);
  await page.route(api + 'inbox', (r) => r.fulfill({ json: [] }));
  await page.goto('/dossiers-recus');
  await expect(
    page.getByRole('heading', { name: 'Dossiers reçus' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Déposer|Remplacer/ }),
  ).toHaveCount(0);
});
