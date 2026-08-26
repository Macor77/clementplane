# Audit initial — Rebranding Clementplane

Date : 26 août 2026

## Point de départ Git

- Branche : `sprint19.5-clementplane-rebrand`
- Commit de départ : `e05490b`
- Version de référence : `v0.19.0`

## Baseline qualité

- `npm install` : OK
- `npm run build` : OK
- `npm test -- --run` : OK
- Tests Vitest : 62/62 réussis
- `npm run lint` : échec préexistant avant rebranding
  - 6 erreurs `process is not defined`
  - 2 warnings React Hooks
- Warning Vite préexistant : bundle principal > 500 kB

## Inventaire Formaplane

- Inventaire global : 792 occurrences
- Les anciennes migrations Supabase déjà appliquées restent des exceptions historiques autorisées.
- Les références actives doivent être migrées vers Clementplane.
- Les mentions historiques dans ROADMAP/CHANGELOG pourront être conservées uniquement lorsqu'elles documentent explicitement l'ancien nom.

## Règles de migration

- Aucune perte de données Supabase.
- Aucun reset de la base.
- Renommage des contrats actifs via nouvelles migrations compatibles.
- Toute dépendance active Formaplane doit disparaître avant la clôture du Sprint 19.5.
