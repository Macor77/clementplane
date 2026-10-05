# Missions personnelles — plan d’implémentation

Exécution native avec superpowers:executing-plans. Référence : DESIGN.md et prompt utilisateur.
Objectif : créer, modifier, annuler et retrouver une mission privée dans l’agenda partagé fonctionnellement avec les missions OF.
Stack : React/Vite, Supabase PostgreSQL, Vitest, Playwright.
Contraintes globales : v0.21.1 ; aucun envoi ; aucune production avant accord ; granularité quotidienne ; confidentialité serveur.

## Risques prioritaires
- Accès direct autre formateur/OF/anon : tests SQL sous rôles.
- Chevauchements et annulation d’une mission parmi plusieurs : tests engagements dérivés.
- Double soumission et réponse perdue : UUID stable et révision optimiste.
- Dates invalides, fuseaux, rémunération 0 : tests validation.
- Missions OF multidates et navigation personnelle : tests agrégation et navigateur.

## Tâche 1 — socle privé
- [x] Tests en échec : validation dates/horaires, normalisation, agrégation et chevauchements.
- [x] Table RLS, validation serveur, statut/horodatage, engagements OF neutres et formateur.
- [x] Exécuter SQL avec fixtures fictives et rôles ; aucune base de production modifiée.
- [x] Service CRUD et lecture commune ; tests verts.

## Tâche 2 — parcours et intégration
- [x] Formulaire accessible, dates multiples, Mes OF facultatif, notes et tarif, erreurs persistantes.
- [x] Detail, édition, annulation et trace ; warnings non bloquants.
- [x] Intégrer missions/planning/dashboard/disponibilités, compter les missions uniques.
- [x] Recette navigateur desktop/mobile ; échec réseau et rechargement.

## Tâche 3 — clôture préparée
- [x] Suite, SQL, build, PWA, revue indépendante.
- [x] Documentation, RGPD, aides, version v0.21.1, changelogs et roadmaps.
- [ ] Commit, push branche, PR, archive reproductible et brouillon release si disponible.
- [ ] Bilan précis et demande finale limitée aux actions de production nécessaires.
