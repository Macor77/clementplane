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

**V1.2.3 — Notifications de réponse aux missions (22 octobre 2026)**

Connexion facultative au calendrier séparé « Prénom Nom — Clementplane ». Version technique 1.2.3 ; [état de livraison](docs/sprints/v1.2.3/CLOSURE.md).

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

## Dernier sprint livré

**V1.2 — Synchronisation Google Agenda**

Les propositions, options et missions sont recopiées dans un calendrier Google séparé après connexion volontaire. La création de missions personnelles de V1.1 reste disponible.

## Rectification de version — 6 octobre 2026

À la demande de Vincent, la livraison porte le nom **V1.1**, version technique et tag `v1.1.0`. Le périmètre et les migrations de v0.21.1 restent identiques. Dossier de clôture historique : `docs/sprints/v0.21.1/CLOSURE.md`. Notes définitives : `docs/releases/v1.1.0.md`.

## Correctif V1.2.1 — 15 octobre 2026

Disponibilités : confirmation serveur, messages de session/réseau et reprise. Aucun changement SQL, RLS, API serveur ou traitement de données. Livraison et preuves : docs/sprints/v1.2.1/CLOSURE.md.

## Correctif V1.2.2 — 19 octobre 2026

Conservation des formulaires au retour sur un onglet. Diagnostic, validation et livraison : docs/sprints/form-tab-return/CLOSURE.md. Aucun changement serveur ni stockage de brouillons.

## V1.2.4 — Confirmation manuelle de revalidation
L’OF peut enregistrer un accord reçu hors Clementplane, même après envoi d’un e-mail. RPC `confirm_mission_change_for_organization` : vérification OF actif, réponse ciblée en attente, journal auteur/canal, conservation de l’affectation. Dossier et preuves : `docs/sprints/manual-revalidation/`. Tests : `node scripts/testing/manual-revalidation-sql.mjs`, scénario navigateur `11-manual-revalidation.spec.js`.
