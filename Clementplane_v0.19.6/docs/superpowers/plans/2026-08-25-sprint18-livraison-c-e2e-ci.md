# Sprint 18 Livraison C — E2E & CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à Formaplane des tests Playwright de bout en bout contre un projet Supabase E2E permanent et une CI GitHub qui exécute automatiquement tests, build et E2E sans risque pour la production.

**Architecture:** Playwright exécute 5 parcours critiques sur une instance Vite configurée avec `formaplane-e2e`. Un script Node de seed/reset utilise la service role uniquement côté CI et comporte un garde-fou qui refuse toute exécution destructive contre le projet Supabase de production.

**Tech Stack:** React, Vite 7.3.6, Vitest 3.2.7, Supabase JS, Playwright, GitHub Actions, Node.js 20.

**Spec:** `docs/superpowers/specs/2026-08-25-sprint18-livraison-c-e2e-ci-design.md`

## Global Constraints

- Ne jamais exécuter de reset/seed destructif sur le projet Supabase production `hctvkynrgmnxjynbncdi`.
- Exiger `E2E_ALLOW_RESET=true` avant toute mutation de préparation E2E.
- Ne jamais exposer `E2E_SUPABASE_SERVICE_ROLE_KEY` au frontend Vite.
- Ne jamais envoyer de véritable e-mail depuis les E2E.
- Conserver les 42 tests Vitest/contrats existants au vert.
- CI sur `push` vers `main`, Pull Request vers `main` et `workflow_dispatch`.
- Limiter le Sprint 18 à 5 parcours E2E critiques.

---

### Task 1: Installer Playwright et créer le garde-fou d’environnement

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.js`
- Create: `tests/e2e/support/environment.js`
- Create: `tests/e2e/support/environment.test.js`

**Interfaces:**
- Consumes: `process.env.E2E_SUPABASE_URL`, `process.env.E2E_ALLOW_RESET`.
- Produces: `assertSafeE2EEnvironment({ url, allowReset })` qui lève une erreur si l’environnement n’est pas explicitement E2E.

- [ ] **Step 1: Ajouter Playwright**

Run:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

Expected: `@playwright/test` présent dans `devDependencies` et Chromium installé localement.

- [ ] **Step 2: Écrire le test du garde-fou avant l’implémentation**

Create `tests/e2e/support/environment.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { assertSafeE2EEnvironment } from './environment.js';

describe('assertSafeE2EEnvironment', () => {
  it('refuse la production Formaplane', () => {
    expect(() => assertSafeE2EEnvironment({
      url: 'https://hctvkynrgmnxjynbncdi.supabase.co',
      allowReset: 'true',
    })).toThrow(/production/i);
  });

  it('refuse un reset non explicitement autorisé', () => {
    expect(() => assertSafeE2EEnvironment({
      url: 'https://example-e2e.supabase.co',
      allowReset: 'false',
    })).toThrow(/E2E_ALLOW_RESET/i);
  });

  it('accepte un projet E2E explicitement autorisé', () => {
    expect(() => assertSafeE2EEnvironment({
      url: 'https://example-e2e.supabase.co',
      allowReset: 'true',
    })).not.toThrow();
  });
});
```

- [ ] **Step 3: Vérifier que le test échoue**

Run:
```bash
npx vitest run tests/e2e/support/environment.test.js
```

Expected: FAIL car `environment.js` n’existe pas encore.

- [ ] **Step 4: Implémenter le garde-fou minimal**

Create `tests/e2e/support/environment.js`:
```js
const PROD_REF = 'hctvkynrgmnxjynbncdi';

export function assertSafeE2EEnvironment({ url, allowReset }) {
  if (!url) throw new Error('E2E_SUPABASE_URL manquante');
  if (url.includes(PROD_REF)) throw new Error('Refus: projet Supabase de production détecté');
  if (allowReset !== 'true') throw new Error('E2E_ALLOW_RESET=true est requis');
  if (!/e2e/i.test(url)) throw new Error('L’URL Supabase doit identifier explicitement un environnement E2E');
}
```

- [ ] **Step 5: Ajouter la configuration Playwright**

Create `playwright.config.js`:
```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 6: Ajouter les scripts npm**

Add to `package.json` scripts:
```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed",
"test:e2e:report": "playwright show-report"
```

- [ ] **Step 7: Vérifier tests existants + garde-fou**

Run:
```bash
npm test
```

Expected: les 42 tests existants + les 3 tests de garde-fou passent.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json playwright.config.js tests/e2e/support
git commit -m "Sprint 18: add Playwright and E2E safety guard"
```

---

### Task 2: Créer le seed/reset E2E limité aux données de test

**Files:**
- Create: `scripts/e2e/reset-and-seed.mjs`
- Create: `tests/e2e/support/testData.js`
- Create: `tests/e2e/support/testData.test.js`

**Interfaces:**
- Consumes: `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_PASSWORD`, `E2E_ALLOW_RESET`.
- Produces: comptes OF/formateur E2E déterministes et un fichier de données exportées via fonctions partagées.

- [ ] **Step 1: Définir les identités E2E par test**

Create `tests/e2e/support/testData.js`:
```js
export const E2E_ORG_EMAIL = 'e2e.of@formaplane.test';
export const E2E_TRAINER_EMAIL = 'e2e.trainer@formaplane.test';
export const E2E_MISSION_TITLE = 'E2E Mission Sprint 18';

export function futureIsoDate(days = 14) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 2: Tester la génération de date future**

Create `tests/e2e/support/testData.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { futureIsoDate } from './testData.js';

describe('futureIsoDate', () => {
  it('retourne une date ISO YYYY-MM-DD située dans le futur', () => {
    const value = futureIsoDate(14);
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${value}T00:00:00Z`).getTime()).toBeGreaterThan(Date.now());
  });
});
```

- [ ] **Step 3: Écrire `reset-and-seed.mjs` avec validation avant client Supabase**

Create `scripts/e2e/reset-and-seed.mjs` using `@supabase/supabase-js`, import `assertSafeE2EEnvironment`, and call the guard before `createClient`.

The script must:
```js
assertSafeE2EEnvironment({
  url: process.env.E2E_SUPABASE_URL,
  allowReset: process.env.E2E_ALLOW_RESET,
});

if (!process.env.E2E_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('E2E_SUPABASE_SERVICE_ROLE_KEY manquante');
}
if (!process.env.E2E_TEST_PASSWORD) {
  throw new Error('E2E_TEST_PASSWORD manquant');
}
```

Then it must create/update the two auth users by e-mail, and delete/recreate only rows linked to those E2E identities. No global truncate or delete without an E2E predicate is allowed.

- [ ] **Step 4: Ajouter le script npm de seed**

Add to `package.json`:
```json
"e2e:seed": "node scripts/e2e/reset-and-seed.mjs"
```

- [ ] **Step 5: Vérifier que le script refuse la production**

Run:
```bash
E2E_SUPABASE_URL=https://hctvkynrgmnxjynbncdi.supabase.co E2E_ALLOW_RESET=true E2E_SUPABASE_SERVICE_ROLE_KEY=x E2E_TEST_PASSWORD=x npm run e2e:seed
```

Expected: échec immédiat avec message production, avant tout appel réseau destructif.

- [ ] **Step 6: Lancer les tests unitaires**

Run:
```bash
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/e2e tests/e2e/support package.json package-lock.json
git commit -m "Sprint 18: add isolated E2E seed tooling"
```

---

### Task 3: Ajouter les helpers de connexion Playwright

**Files:**
- Create: `tests/e2e/support/auth.js`
- Create: `tests/e2e/specs/01-auth-smoke.spec.js`

**Interfaces:**
- Consumes: `E2E_ORG_EMAIL`, `E2E_TRAINER_EMAIL`, `E2E_TEST_PASSWORD`.
- Produces: `loginAsOrganization(page)` et `loginAsTrainer(page)`.

- [ ] **Step 1: Écrire un smoke test OF**

Create `tests/e2e/specs/01-auth-smoke.spec.js`:
```js
import { test, expect } from '@playwright/test';
import { loginAsOrganization } from '../support/auth.js';

test('un OF E2E peut se connecter', async ({ page }) => {
  await loginAsOrganization(page);
  await expect(page).not.toHaveURL(/login/);
  await expect(page.getByText(/Formaplane/i).first()).toBeVisible();
});
```

- [ ] **Step 2: Implémenter les helpers en ciblant les libellés réels de Login**

`tests/e2e/support/auth.js` must navigate to the actual login route, fill the email/password fields using accessible labels or stable selectors from the existing page, submit, and wait until navigation leaves login.

- [ ] **Step 3: Exécuter contre `formaplane-e2e` après configuration locale**

Run:
```bash
VITE_SUPABASE_URL="$E2E_SUPABASE_URL" \
VITE_SUPABASE_ANON_KEY="$E2E_SUPABASE_ANON_KEY" \
E2E_TEST_PASSWORD="$E2E_TEST_PASSWORD" \
npm run build && npm run test:e2e -- tests/e2e/specs/01-auth-smoke.spec.js
```

Expected: PASS pour le compte OF E2E.

- [ ] **Step 4: Ajouter le smoke formateur**

Add a second Playwright test using `loginAsTrainer(page)` and verify access to the trainer area.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/support/auth.js tests/e2e/specs/01-auth-smoke.spec.js
git commit -m "Sprint 18: add E2E authentication helpers"
```

---

### Task 4: Parcours OF — création mission puis proposition

**Files:**
- Create: `tests/e2e/specs/02-organization-mission.spec.js`
- Modify only if required for stable selectors: mission-related React components/pages, adding `data-testid` attributes without changing behavior.

**Interfaces:**
- Consumes: `loginAsOrganization(page)`, `E2E_MISSION_TITLE`, `futureIsoDate()`.
- Produces: mission E2E créée puis proposition envoyée au formateur E2E.

- [ ] **Step 1: Écrire le test création mission**

The test must:
```js
await loginAsOrganization(page);
// Navigate using the real Missions menu/route.
// Click the existing create-mission action.
// Fill required fields with deterministic E2E values.
// Save.
await expect(page.getByText(E2E_MISSION_TITLE)).toBeVisible();
```

- [ ] **Step 2: Lancer et observer l’échec initial**

Run:
```bash
npm run test:e2e -- tests/e2e/specs/02-organization-mission.spec.js
```

Expected: FAIL until selectors/required fields exactly match the current UI.

- [ ] **Step 3: Stabiliser uniquement les sélecteurs nécessaires**

If labels are ambiguous, add minimal attributes such as:
```jsx
<button data-testid="mission-create">Créer une mission</button>
```

Do not refactor mission behavior.

- [ ] **Step 4: Étendre le test à la proposition formateur**

From the mission detail, select the E2E trainer and trigger the existing proposal action. Assert the UI shows the proposal state. Do not depend on receiving an e-mail.

- [ ] **Step 5: Exécuter le scénario complet**

Run:
```bash
npm run test:e2e -- tests/e2e/specs/02-organization-mission.spec.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/specs/02-organization-mission.spec.js src
 git commit -m "Sprint 18: cover organization mission flow with E2E"
```

---

### Task 5: Parcours formateur réponse + OF affectation

**Files:**
- Create: `tests/e2e/specs/03-proposal-assignment.spec.js`
- Modify only if required for stable selectors: proposal/mission React pages.

**Interfaces:**
- Consumes: seeded trainer/organization and mission/proposal state from a fresh reset/seed plus setup performed inside the test suite.
- Produces: proposition répondue puis formateur unique affecté.

- [ ] **Step 1: Préparer l’état dans le test sans dépendre d’un test précédent**

Each test must create its own mission/proposal through UI or a dedicated E2E setup helper; it must not rely on Playwright test ordering.

- [ ] **Step 2: Écrire le parcours formateur**

Test actions:
```js
await loginAsTrainer(page);
// Navigate to propositions.
// Open the E2E proposal.
// Use the current positive-response action.
// Assert the resulting status shown in UI.
```

- [ ] **Step 3: Écrire le parcours OF d’affectation dans le même scénario**

Logout/switch session, login as organization, open the mission, affect the responding trainer, then assert the trainer is shown as assigned.

- [ ] **Step 4: Vérifier l’unicité**

Assert the mission detail contains exactly one assigned trainer entry or the equivalent stable UI indicator.

- [ ] **Step 5: Exécuter**

Run:
```bash
npm run test:e2e -- tests/e2e/specs/03-proposal-assignment.spec.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/specs/03-proposal-assignment.spec.js src
git commit -m "Sprint 18: cover proposal response and assignment E2E"
```

---

### Task 6: Parcours formateur disponibilité et persistance planning

**Files:**
- Create: `tests/e2e/specs/04-trainer-availability.spec.js`
- Modify only if required for stable selectors: trainer availability/calendar components.

**Interfaces:**
- Consumes: `loginAsTrainer(page)`, a deterministic future date.
- Produces: assertion de persistance après reload.

- [ ] **Step 1: Écrire le test de modification de disponibilité**

The test logs in as trainer, opens the availability page, chooses a future date that is not occupied by the E2E mission, changes it to `Disponible`, and asserts the visible state.

- [ ] **Step 2: Recharger et vérifier la persistance**

```js
await page.reload();
// Re-open the same month if needed.
await expect(/* same date cell */).toContainText(/Disponible/i);
```

- [ ] **Step 3: Ajouter un `data-testid` ciblé si nécessaire**

Prefer a deterministic value such as:
```jsx
data-testid={`availability-day-${isoDate}`}
```

- [ ] **Step 4: Exécuter**

Run:
```bash
npm run test:e2e -- tests/e2e/specs/04-trainer-availability.spec.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/specs/04-trainer-availability.spec.js src
git commit -m "Sprint 18: cover trainer availability persistence E2E"
```

---

### Task 7: Ajouter la CI GitHub Actions

**Files:**
- Create: `.github/workflows/quality-e2e.yml`

**Interfaces:**
- Consumes GitHub Secrets: `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_PASSWORD`.
- Produces: workflow automatique qualité + E2E.

- [ ] **Step 1: Créer le workflow**

Create `.github/workflows/quality-e2e.yml` with:
```yaml
name: Quality & E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm audit --audit-level=high
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    env:
      E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
      E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
      E2E_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
      E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
      E2E_ALLOW_RESET: 'true'
      VITE_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e:seed
      - run: npm run build
      - run: npm run test:e2e
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          if-no-files-found: ignore
```

- [ ] **Step 2: Vérifier la syntaxe localement**

Run:
```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/quality-e2e.yml
git commit -m "Sprint 18: add automated quality and E2E CI"
```

---

### Task 8: Documenter la création de `formaplane-e2e` et les secrets

**Files:**
- Modify: `docs/TESTING.md`
- Create: `docs/E2E_SETUP.md`

**Interfaces:**
- Consumes: design/spec and workflow secret names.
- Produces: procédure reproductible pour Vincent/mainteneur.

- [ ] **Step 1: Documenter la création du projet Supabase**

`docs/E2E_SETUP.md` must state:

1. Create a Supabase project named `formaplane-e2e`.
2. Apply the schema/migrations required by current Formaplane state without touching production.
3. Record project URL, anon key and service role key.
4. Never paste service role key into `.env` committed files.
5. Configure the four GitHub Actions secrets exactly as named in the spec.

- [ ] **Step 2: Ajouter la procédure locale**

Document environment variables and commands:
```bash
export E2E_SUPABASE_URL='https://...e2e.supabase.co'
export E2E_SUPABASE_ANON_KEY='...'
export E2E_SUPABASE_SERVICE_ROLE_KEY='...'
export E2E_TEST_PASSWORD='...'
export E2E_ALLOW_RESET='true'
export VITE_SUPABASE_URL="$E2E_SUPABASE_URL"
export VITE_SUPABASE_ANON_KEY="$E2E_SUPABASE_ANON_KEY"

npm run e2e:seed
npm run build
npm run test:e2e
```

- [ ] **Step 3: Mettre `docs/TESTING.md` à jour**

Add the three test layers:
- Vitest unit tests;
- SQL/security contracts;
- Playwright E2E isolated environment.

- [ ] **Step 4: Commit**

```bash
git add docs/TESTING.md docs/E2E_SETUP.md
git commit -m "Sprint 18: document isolated E2E environment"
```

---

### Task 9: Validation finale et documentation Sprint 18

**Files:**
- Modify: `ROADMAP.md`
- Modify: `docs/ROADMAP.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/TESTING.md` if final counts differ.

**Interfaces:**
- Consumes: all tasks above.
- Produces: Sprint 18 ready for `v0.18.0` closure.

- [ ] **Step 1: Exécuter toute la validation locale**

Run:
```bash
npm test
npm audit
npm run build
```

Expected:
- all Vitest/contracts PASS;
- `found 0 vulnerabilities` or no high-severity vulnerability;
- Vite build PASS.

- [ ] **Step 2: Exécuter les E2E sur l’environnement isolé**

Run:
```bash
npm run e2e:seed
npm run test:e2e
```

Expected: 5 parcours critiques PASS.

- [ ] **Step 3: Vérifier le garde-fou production une dernière fois**

Run:
```bash
E2E_SUPABASE_URL=https://hctvkynrgmnxjynbncdi.supabase.co \
E2E_ALLOW_RESET=true \
E2E_SUPABASE_SERVICE_ROLE_KEY=x \
E2E_TEST_PASSWORD=x \
npm run e2e:seed
```

Expected: FAIL volontairement avant mutation avec message production.

- [ ] **Step 4: Vérifier GitHub Actions**

After push, confirm the `Quality & E2E` workflow has a green `quality` job and green `e2e` job. On failure, inspect the uploaded Playwright report artifact.

- [ ] **Step 5: Mettre les docs de sprint à jour**

Mark Sprint 18 completed only after all local checks and GitHub Actions are green. Document:
- number of Vitest/contract tests;
- 5 E2E critical flows;
- isolated Supabase environment;
- automatic GitHub CI;
- client error monitoring from Delivery B;
- dependency audit status.

- [ ] **Step 6: Commit de clôture technique**

```bash
git add ROADMAP.md docs/ROADMAP.md CHANGELOG.md docs/TESTING.md
git commit -m "Sprint 18: finalize automated testing and surveillance"
git push
```

- [ ] **Step 7: Préparer la release**

Run:
```bash
git status
git log -5 --oneline
```

Expected: working tree clean and all Sprint 18 commits present before tagging `v0.18.0`.

## Ruling final — environnement E2E différé

Le projet Supabase E2E permanent prévu initialement n'est pas créé pendant le Sprint 18 en raison de son coût récurrent. Les tâches de préparation Playwright restent livrées, mais l'exécution réelle des scénarios et le job GitHub Actions E2E sont différés jusqu'à la mise à disposition d'un environnement isolé. Le job `quality` gratuit reste obligatoire sur `main`, Pull Requests et `workflow_dispatch`.
