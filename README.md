# Clementplane

Clementplane est une plateforme web collaborative destinée aux organismes de formation et aux formateurs indépendants.

Elle centralise notamment :

- les profils formateurs ;
- les réseaux privés propres à chaque organisme ;
- les disponibilités ;
- les missions et propositions ;
- les affectations et revalidations ;
- les plannings OF et Formateur ;
- le partage des disponibilités ;
- les contacts et invitations OF ;
- l’administration et les statistiques d’usage.

## Version actuelle

**v0.20.0 — Sprint 20 : PWA / Clementplane installable sur mobile**

Clementplane peut désormais être installé sur Android et iPhone/iPad et lancé depuis l’écran d’accueil comme une application.

## Stack principale

- React
- Vite
- JavaScript
- Supabase / PostgreSQL
- Supabase Auth
- Supabase Edge Functions
- Vercel
- Brevo
- Vitest
- Playwright
- vite-plugin-pwa / Workbox

## Installation locale

```bash
npm ci
npm run dev
```

## Contrôles qualité

```bash
npm test
npm run lint
npm run build
```

Test PWA Playwright :

```bash
npx playwright test tests/e2e/specs/05-pwa-shell.spec.js
```

Si Chromium et ses dépendances Playwright ne sont pas encore installés :

```bash
npx playwright install chromium
npx playwright install-deps chromium
```

## Supabase

Projet Clementplane :

```text
hctvkynrgmnxjynbncdi
```

Avant toute migration depuis un nouvel environnement :

```bash
npx supabase login
npx supabase link --project-ref hctvkynrgmnxjynbncdi
npx supabase migration list
```

Toujours vérifier le projet lié avant d’exécuter une migration ou `db push`.

## PWA

La configuration PWA repose notamment sur :

- `vite-plugin-pwa`
- `pwa.config.js`
- `src/components/pwa/PwaManager.jsx`
- `src/pwa/pwaEnvironment.js`
- `public/icons/`

Le service worker conserve le shell et les ressources statiques utiles au démarrage.

Les données métier Supabase ne sont pas conçues pour être modifiées hors connexion ni synchronisées comme une base offline.

## Documentation

Les documents principaux sont disponibles dans `docs/` :

- `ROADMAP.md`
- `PRD.md`
- `ARCHITECTURE.md`
- `FONCTIONNEL.md`
- `DATABASE.md`
- `DECISIONS.md`
- `TESTING.md`
- `E2E_SETUP.md`
- `TROUBLESHOOTING.md`
- `CHANGELOG.md`

La roadmap principale existe également à la racine dans `ROADMAP.md`.

## Déploiement

- GitHub : dépôt Clementplane
- Vercel : application web
- Production : `clementplane.fr`
- Supabase : backend et base PostgreSQL

## Prochain sprint

**Sprint 21 — Création autonome de missions par le formateur**

Objectif : permettre au formateur d’ajouter à son agenda Clementplane une mission confiée par un organisme qui n’utilise pas encore la plateforme, afin que Clementplane devienne son planning professionnel de référence.
