# Tests automatisés et recette — Clementplane v0.20.0

## Objectif

Le dispositif de tests introduit au Sprint 18 protège les règles métier sensibles de Clementplane. Le Sprint 20 ajoute la recette PWA, tout en conservant l’interdiction absolue des tests destructifs sur la production.

## Commandes

```bash
npm test
npm run test:unit
npm run test:contracts
npm run test:watch
```

`npm run test:coverage` sera utilisé lorsque le module de couverture Vitest sera ajouté/validé.

## Couche 1 — tests unitaires

Les tests placés dans `src/**/__tests__` protègent les validations métier et le comportement des services JavaScript. Supabase est simulé lorsque le test n'a pas besoin d'une vraie base.

## Couche 2 — contrats de sécurité SQL

Les tests de `tests/contracts` vérifient que les migrations de référence conservent les garde-fous critiques : RLS, cloisonnement par organisme, absence de droits anonymes directs, authentification des RPC sensibles et affectation atomique.

Ces tests sont volontairement distincts de vrais tests d'intégration base. Ils empêchent une régression dans le code versionné, mais ne prouvent pas à eux seuls l'état d'une base déployée.

## Couche 3 — E2E Playwright : tests isolés et activation contrôlée

Les parcours Playwright nécessitant des données métier restent conditionnés à un environnement Supabase E2E séparé de la production. Les tests de shell ne nécessitant pas d’écriture métier, comme le contrôle des métadonnées PWA du Sprint 20, peuvent être exécutés localement sans projet Supabase E2E.

## Règle absolue

Aucun test automatisé ne doit :

- envoyer un vrai e-mail à un utilisateur ;
- écrire ou supprimer des données de production ;
- utiliser un token public réel issu d'une mission en production ;
- exposer une clé `service_role` dans le navigateur ou dans Git.

## Sprint 18 — Livraison B

La livraison B ajoute des garde-fous sur les flux sensibles qui entourent les missions :

- visibilité des disponibilités selon l’OF destinataire ;
- confidentialité des missions/options concurrentes ;
- contrat serveur du cooldown de 20 jours ;
- verrou atomique anti double-envoi ;
- validation du formulaire public et de son rate limiting ;
- désabonnement public limité aux nouveautés ;
- appels au moteur d’e-mails simulés : aucun test n’envoie de véritable e-mail ;
- capture des erreurs React, `window.error` et promesses non gérées pour les utilisateurs authentifiés.

### Surveillance applicative

Les erreurs client authentifiées sont enregistrées comme événement `client_error` dans `product_events` via `track_product_event`. La table reste sous RLS et aucune donnée n’est écrite directement depuis le navigateur. L’échec du monitoring ne doit jamais provoquer une nouvelle panne : la remontée d’erreur est volontairement non bloquante.

Les Edge Functions conservent par ailleurs leurs `console.error`, consultables dans les logs Supabase. Une solution d’alerte externe pourra être branchée ultérieurement si le volume d’utilisation justifie un monitoring dédié.


## Tests E2E Playwright

Playwright est installé et les parcours critiques sont préparés, mais ils restent **désactivés dans GitHub Actions** tant qu’aucun projet Supabase E2E isolé n’est configuré.

La CI active du Sprint 18 exécute gratuitement à chaque `push` sur `main`, Pull Request vers `main`, lancement manuel et chaque lundi matin (07:00 UTC) :

```bash
npm ci
npm test
npm audit --audit-level=high
npm run build
```

Les scripts E2E restent disponibles pour une activation future :

```bash
npm run e2e:seed
npm run test:e2e
```

Le seed est protégé par `E2E_ALLOW_RESET=true`, `E2E_PROJECT_REF` et un blocage explicite de la ref production `hctvkynrgmnxjynbncdi`. Voir `docs/E2E_SETUP.md`.

## Sprint 20 — Recette PWA

### Contrôles Codespaces / preview de production

1. `npm ci`
2. `npm test`
3. `npm run lint`
4. `npm run build`
5. `npm run preview -- --host 0.0.0.0`
6. Chrome DevTools → Application → Manifest : vérifier **Clementplane**, `standalone`, icônes 192/512 et couleur `#0B132B`.
7. Chrome DevTools → Application → Service Workers : vérifier qu’un worker est activé et contrôle la page.
8. Après un premier chargement, passer DevTools → Network → Offline : le shell doit rester visible et le message « Vous êtes hors connexion » doit apparaître.
9. Repasser Online : le message doit disparaître et les données en ligne doivent pouvoir être rechargées.
10. Après un nouveau build/déploiement, ouvrir l’ancienne PWA : la notification de nouvelle version doit apparaître puis le bouton **Mettre à jour** doit activer la nouvelle version.

### Contrôles mobile réel

- Android / Chrome : installation, icône, lancement standalone, navigation, fermeture/réouverture, offline/online.
- iPhone / Safari : aide « Partager → Sur l’écran d’accueil → Ajouter », icône, lancement standalone, safe areas, navigation, modales, clavier, fermeture/réouverture, offline/online.
- Dans les deux cas, vérifier que Clementplane ne prétend jamais permettre une saisie métier hors connexion et qu’aucune donnée Supabase ancienne n’est présentée comme une donnée hors ligne synchronisable.


### Sprint 20 — invitation et statistiques PWA

1. Utilisateur authentifié sur Android/Chrome avec PWA non installée : l’invitation **Clementplane sur votre téléphone** doit proposer **Installer Clementplane** dès que le navigateur expose l’installation native.
2. Fermer l’invitation : elle ne doit plus réapparaître pendant 7 jours sur ce navigateur.
3. Installer puis lancer Clementplane depuis l’icône : l’invitation d’installation ne doit pas apparaître dans la PWA.
4. iPhone/iPad : le bouton d’installation doit afficher l’aide **Partager → Sur l’écran d’accueil → Ajouter**.
5. Après migration Supabase, ouvrir une session depuis le navigateur puis depuis la PWA et vérifier que `product_events` reçoit `app_opened` avec `access_mode` respectivement `browser` et `pwa`.
6. Dans `/admin`, vérifier la section **Application mobile / PWA** : utilisateurs PWA, taux global, détail OF/Formateurs et répartition des ouvertures sur 30 jours.


## Clôture Sprint 20 — résultats validés

La recette finale du Sprint 20 a confirmé :

- `npm ci` réussi ;
- 19 fichiers de tests Vitest réussis, soit 78 tests sur 78 ;
- `npm run lint` : 0 erreur et 2 warnings React Hooks connus ;
- `npm run build` réussi avec génération de `manifest.webmanifest`, `sw.js` et Workbox ;
- `npx playwright test tests/e2e/specs/05-pwa-shell.spec.js` réussi après installation des dépendances navigateur nécessaires ;
- installation Android réelle validée ;
- lancement depuis l’icône et mode standalone validés ;
- comportement offline / retour online validé ;
- disparition de l’invitation dans la PWA installée validée ;
- statistiques PWA vérifiées dans l’Admin ;
- déploiement de production Vercel validé.

Le warning Vite sur la taille du bundle reste un axe d’optimisation et n’a pas bloqué la clôture du Sprint 20.
