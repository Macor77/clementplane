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

## Couche 3 — intégration Supabase isolée (à raccorder dans le Sprint 18)

Les tests qui créent des utilisateurs, organismes, missions et propositions devront s'exécuter uniquement sur un environnement Supabase local ou de test dédié. Ils ne doivent jamais recevoir les secrets `service_role` du projet de production.

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
