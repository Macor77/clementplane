# Tests automatisés — Sprint 18

## Objectif

Le Sprint 18 introduit un filet de sécurité automatisé autour des règles métier les plus sensibles de Formaplane, sans jamais exécuter de tests destructifs sur la production.

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

## Couche 3 — E2E Playwright préparé, activation différée

Les parcours Playwright sont présents dans le dépôt mais ne sont pas exécutés automatiquement pendant le Sprint 18. Leur activation nécessite un environnement Supabase séparé de la production. La création d’un projet E2E permanent payant a été volontairement différée tant que son coût n’est pas justifié par l’usage.

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
