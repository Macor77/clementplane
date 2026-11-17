## V1.7.0 publiée — statistiques sur mobile, 17 novembre 2026

CA des formations réalisées (HT/TTC séparés), frais privés par catégorie et dépense, chiffres consultables par mission, aides « ? », périodes/filtres, évolution/comparaison, bilans à compléter avec date de fin et objectif mensuel facultatif. Publication explicitement validée par Vincent : PR #28 fusionnée, migration des objectifs appliquée en production, Vercel READY et V1.7.0 vérifiée sur app.clementplane.fr. 424 tests unitaires/contrats et 74 parcours navigateur réussis ; captures fictives contrôlées. Dossier : `docs/sprints/v1.7.0/` (ou `sprints/v1.7.0/` depuis docs). Aucun e-mail envoyé.

## V1.6.0 publiée — décomptes séparés, 16 novembre 2026

Apprenants entièrement formés et partiellement formés saisis et affichés séparément ; total des participants calculé à part et statistiques cohérentes. Anciennes données conservées sans migration. Publication explicitement validée par Vincent : [PR #27](https://github.com/Macor77/clementplane/pull/27) fusionnée, Vercel production READY et V1.6.0 servie sur app.clementplane.fr. 413 tests unitaires/contrats et 67 parcours navigateur réussis ; captures contrôlées. Preuves : `docs/sprints/v1.6.0/` (ou `sprints/v1.6.0/` depuis docs). Cette saisie séparée remplace l’inclusion décrite dans les versions historiques ci-dessous.

## V1.5.1 publiée — bilan compact et aides contextuelles, 16 novembre 2026

Les boutons « ? » conservent toutes les explications dans une fenêtre adaptée au mobile. Intitulés, unités, confidentialité et inclusion des apprenants partiels restent visibles. Publication explicitement autorisée par Vincent : PR #26 fusionnée, Vercel production READY et V1.5.1 servie sur app.clementplane.fr. 406 tests unitaires et 63 parcours navigateur réussis ; captures contrôlées. Aucun changement métier ou de permissions, aucune migration. Dossier : `docs/sprints/v1.5.1/` (ou `sprints/v1.5.1/` depuis docs).

## V1.5.0 publiée — apprenants partiellement formés, 16 novembre 2026

Volet fermé par défaut, lignes par effectif et durée, incluses dans le total existant sans double comptage. Publiée après accord explicite de Vincent : PR #25 fusionnée, migration production `20261116095526`, Vercel READY et version V1.5.0 servie sur app.clementplane.fr. Recette : 406 tests unitaires, 58 parcours navigateur et PostgreSQL/RLS réel en démonstration. Dossier et preuves : `docs/sprints/v1.5.0/` (ou `sprints/v1.5.0/` depuis docs). Statistiques et données privées préservées ; aucune nouvelle complexité de groupes.

## V1.4.0 publiée — frais détaillés, 15 novembre 2026

Dépenses privées par ligne, onze catégories et total automatique. Anciens montants et textes conservés. Publiée après validation de Vincent : PR #24 fusionnée, migration appliquée, Vercel production READY. Recette : 389 unitaires et 53 parcours navigateur. Dossier : `docs/sprints/v1.4.0/` (ou `sprints/v1.4.0/` depuis docs). Mes statistiques reste inchangé ; exploitation des frais à cadrer dans un sprint ultérieur.

## V1.3.2 publiée — simplification du bilan, 14 novembre 2026

Une mission = une session = un groupe. Intitulé verrouillé, seuls les apprenants formés et les durées réelles en jours/heures sont saisis. Anciens bilans conservés ; effectifs et heures prévus retirés. PR #23 fusionnée, migration appliquée et Vercel production vérifié. 367 tests unitaires et 49 parcours navigateur réussis. Dossier : `docs/sprints/v1.3.2/`.

# Clementplane

## V1.3.1 publiée — installation mobile, 12 novembre 2026

Parcours d’installation et liens automatiques des e-mails de nouveautés rattachés à **https://app.clementplane.fr**. PR #22 publiée, fonction Edge et Vercel vérifiés ; 359 tests et 48 parcours navigateur réussis. [Clôture et limites](docs/sprints/pwa-official-installation/CLOSURE.md). Un message pour remplacer les anciennes installations est préparé, non envoyé.

## État du 12 novembre 2026 — V1.3 publiée

Suivi des réalisations et premières statistiques formateur publié après accord de Vincent : [PR #21](https://github.com/Macor77/clementplane/pull/21) fusionnée, trois migrations appliquées, Vercel production vérifié. Bilans par groupe/journée, privé/partagé, réalisé/à venir et données manquantes. Dossier de clôture : `docs/sprints/v1.3/` (ou `sprints/v1.3/` depuis docs), [release v1.3.0](https://github.com/Macor77/clementplane/releases/tag/v1.3.0). Outlook conserve son pilote restreint : cette version ne valide ni n’élargit ce pilote. Suite proposée : observer la complétude des bilans, puis prioriser statistiques détaillées et aide au BPF ; aucun nouveau sprint lancé automatiquement.


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

**Production V1.6.0 — Apprenants entièrement et partiellement formés.**

Un groupe par session, intitulé verrouillé et durées réelles en jours/heures. [État V1.6.0](docs/sprints/v1.6.0/CLOSURE.md).

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

Installer depuis **https://app.clementplane.fr**. Sur une autre origine, le bouton intégré conduit à cette adresse avant installation. Une ancienne PWA liée à un déploiement individuel peut nécessiter un remplacement ponctuel : voir l’aide « Découvrir Clementplane » et le [message préparé](docs/sprints/pwa-official-installation/COMMUNICATION.md).

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

## En préparation — Outlook / Microsoft 365

Intégration facultative isolée de Google, désactivée par défaut. Non livrée : configuration Entra et recette réelle exigées avant activation. [Plan et preuves](docs/sprints/outlook-calendar-sync/PLAN.md), [configuration/exploitation](docs/sprints/outlook-calendar-sync/OPERATIONS.md).
