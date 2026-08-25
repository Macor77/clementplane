# Sprint 18 — Livraison C : E2E isolé & CI — Design

## Objectif

Ajouter un filet de sécurité de bout en bout à Formaplane sans jamais utiliser la production pour les tests destructifs.

## Décisions validées

- Environnement : projet Supabase permanent séparé, nommé `formaplane-e2e`.
- CI : exécution à chaque `push` sur `main` et à chaque Pull Request vers `main`.
- E2E : Playwright.
- Parcours initiaux : 5 parcours critiques uniquement.
- Sécurité : les E2E refusent de démarrer si l’URL Supabase correspond à la production Formaplane.
- Secrets : aucune clé sensible dans le dépôt ; secrets injectés par GitHub Actions.
- Périmètre : ne pas reconstruire tout l’historique Supabase depuis zéro pendant ce sprint.

## Architecture

Le frontend Vite utilisé par Playwright est lancé avec des variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` pointant vers `formaplane-e2e`. Un script Node de préparation E2E utilise côté CI une clé `SUPABASE_SERVICE_ROLE_KEY` dédiée au projet E2E pour créer/remettre en état les comptes et données de test. Cette clé n’est jamais transmise au navigateur.

La CI se compose de deux niveaux :

1. **Qualité rapide** : installation, Vitest/contrats, audit, build.
2. **E2E isolé** : vérification garde-fou environnement, reset/seed E2E, lancement Vite, Playwright Chromium, upload des traces/rapports uniquement en cas d’échec.

## Garde-fou production

Le projet de production connu a pour ref Supabase : `hctvkynrgmnxjynbncdi`.

Tout script E2E destructif doit refuser l’exécution si :

- `VITE_SUPABASE_URL` est absent ;
- `SUPABASE_SERVICE_ROLE_KEY` est absent pour le seed/reset ;
- l’URL contient `hctvkynrgmnxjynbncdi` ;
- l’URL ne contient pas un indicateur explicitement configuré pour l’environnement E2E.

Une variable explicite `E2E_ALLOW_RESET=true` est également requise pour toute opération de reset.

## Données E2E

Le seed crée des identités déterministes, par exemple :

- OF : `e2e.of@formaplane.test`
- Formateur : `e2e.trainer@formaplane.test`
- Mot de passe : fourni via secret `E2E_TEST_PASSWORD`

Les enregistrements créés doivent être repérables par une convention stable (`E2E`, e-mails `.test`, ou identifiants retournés par le seed).

Le reset ne supprime que les données appartenant à ce jeu E2E ; il ne fait aucun `TRUNCATE` global.

## Parcours Playwright initiaux

### 1. OF — connexion et création d’une mission

- connexion avec le compte OF E2E ;
- ouverture du formulaire mission ;
- création d’une mission datée dans le futur ;
- vérification qu’elle apparaît dans la liste/détail.

### 2. OF — proposition à un formateur

- ouvrir la mission créée ;
- sélectionner le formateur E2E ;
- envoyer la proposition sans dépendre d’un vrai e-mail ;
- vérifier l’état de proposition côté interface/base.

### 3. Formateur — consultation et réponse

- connexion avec le compte formateur E2E ;
- ouverture des propositions ;
- réponse positive/option selon le workflow réel ;
- vérification visuelle de l’état.

### 4. OF — affectation

- reconnexion OF ;
- ouverture de la mission ;
- affectation du formateur ayant répondu ;
- vérification qu’un seul formateur est affecté.

### 5. Formateur — disponibilité/planning

- connexion formateur ;
- modification d’une disponibilité sur une date contrôlée ;
- rechargement de la page ;
- vérification de la persistance et du rendu planning.

## E-mails

Les E2E ne doivent pas envoyer de véritables e-mails. Les scénarios doivent utiliser des données E2E et, si nécessaire, un mécanisme de neutralisation/skip d’envoi dans l’environnement de test. Les tests unitaires de la Livraison B restent responsables de la logique d’e-mailing.

## GitHub Actions

Déclencheurs :

- `push` sur `main` ;
- `pull_request` vers `main` ;
- `workflow_dispatch` pour relance manuelle.

Secrets attendus :

- `E2E_SUPABASE_URL`
- `E2E_SUPABASE_ANON_KEY`
- `E2E_SUPABASE_SERVICE_ROLE_KEY`
- `E2E_TEST_PASSWORD`

Le workflow expose au build Vite uniquement URL + anon key. La service role reste disponible uniquement pour le script Node de seed/reset.

## Critères de réussite

- `npm test` reste vert avec les 42 tests existants.
- `npm run build` reste vert.
- Playwright possède 5 scénarios E2E stables.
- Un E2E lancé avec l’URL de production échoue avant toute mutation.
- Le workflow GitHub Actions s’exécute automatiquement sur `main` et PR.
- Un échec Playwright conserve un rapport/trace exploitable.
- La documentation explique comment créer/configurer `formaplane-e2e` et les secrets GitHub.

## Hors périmètre

- Reconstitution intégrale d’une base Supabase locale depuis l’historique complet des migrations.
- Couverture E2E exhaustive de toutes les pages.
- Tests réels de délivrabilité Brevo.
- Monitoring externe payant.

## Décision de clôture — CI gratuite

Après vérification du coût d'un projet Supabase E2E permanent, la création de `formaplane-e2e` est différée. Le Sprint 18 conserve Playwright, les cinq scénarios préparés, les helpers, le seed/reset et les garde-fous, mais **n'exécute pas les E2E automatiquement** tant qu'un environnement Supabase isolé n'existe pas.

La CI active sur `push`/PR exécute uniquement `npm ci`, `npm test`, `npm audit --audit-level=high` et `npm run build`. Cette décision évite toute dépense récurrente et tout risque d'utilisation accidentelle de la production, tout en préservant le travail E2E pour une activation future.
