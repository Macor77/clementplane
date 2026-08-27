# E2E Playwright — préparation pour activation future

## Décision Sprint 18

Formaplane **ne crée pas de projet Supabase E2E payant pour le moment**. Les scénarios Playwright, les helpers et le mécanisme de seed/reset sont conservés dans le dépôt afin de pouvoir activer de vrais tests E2E plus tard sans repartir de zéro.

La CI active du Sprint 18 reste gratuite et exécute automatiquement :

```text
npm ci
npm test
npm audit --audit-level=high
npm run build
```

Les tests Playwright **ne sont pas exécutés automatiquement** tant qu'un environnement Supabase isolé n'est pas configuré.

## Pourquoi les E2E sont désactivés

Les parcours Playwright créent et modifient de vraies données métier. Ils ne doivent jamais cibler la production Formaplane. Un projet Supabase dédié aurait ajouté une dépense récurrente qui n'est pas justifiée au stade actuel du produit.

## Ce qui est déjà prêt

Le dépôt conserve :

- `playwright.config.js` ;
- `tests/e2e/specs/` avec les parcours critiques préparés ;
- `tests/e2e/support/` avec les helpers et garde-fous ;
- `scripts/e2e/reset-and-seed.mjs` ;
- les scripts npm `test:e2e`, `test:e2e:headed`, `test:e2e:report` et `e2e:seed`.

## Activation future

Lorsque le coût d'un environnement dédié sera justifié, créer un projet Supabase distinct, par exemple `formaplane-e2e`, puis configurer :

- `E2E_SUPABASE_URL` ;
- `E2E_SUPABASE_ANON_KEY` ;
- `E2E_SUPABASE_SERVICE_ROLE_KEY` ;
- `E2E_PROJECT_REF` ;
- `E2E_TEST_PASSWORD` ;
- `E2E_ALLOW_RESET=true`.

Le frontend Vite ne doit recevoir que l'URL et l'anon key. La `service_role` reste strictement côté script Node/CI.

## Garde-fou absolu

Le seed/reset refuse systématiquement le projet Supabase de production dont la ref est :

`hctvkynrgmnxjynbncdi`

Il exige aussi que `E2E_PROJECT_REF` corresponde exactement à la ref contenue dans `E2E_SUPABASE_URL` et que `E2E_ALLOW_RESET=true` soit présent avant toute mutation.

## Données autorisées

Le seed ne fait aucun `TRUNCATE` global. Il ne doit travailler que sur les identités et données E2E déterministes, notamment :

- `e2e.of@formaplane.test` ;
- `e2e.trainer@formaplane.test` ;
- l'organisation `formaplane-e2e` ;
- les missions exclusivement rattachées à cette organisation.

## E-mails

Les scénarios Playwright ne doivent jamais envoyer de vrais e-mails. Les tests unitaires de la Livraison B restent responsables de la logique d'e-mailing.
