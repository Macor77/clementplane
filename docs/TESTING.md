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
