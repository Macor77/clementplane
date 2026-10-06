# v0.21.1 — Clôture du sprint, 6 octobre 2026

**Livrée en production et validée par Vincent. Clôture documentaire, tag et release autorisés le 6 octobre 2026.**

## Livraison et preuves
- PR #4 fusionnée : https://github.com/Macor77/clementplane/pull/4
- Correctif du patch : e2138a7a437c7ec4c7675daff697dca672dc2496.
- Commit applicatif de production : 55ba895abaa23ca92d63b5bf9ef9f4f9b50ce0d7.
- CI après fusion : https://github.com/Macor77/clementplane/actions/runs/37449273527 — toutes les étapes réussies.
- Vercel Production : https://vercel.com/formaplane/clementplane/4cX5Wrb8LyPJ23ePwR9JQhvvGoBD — succès.
- https://www.clementplane.fr répond HTTP 200 ; bundle contrôlé : version 0.21.1, Client final, Donneur d’ordre, route /formateur/mes-of?ajouter=1&nom= et projet Supabase de production.
- Vitest : 159 tests, 33 fichiers ; Playwright CI : 3 tests (PWA, parcours personnel 1440/390 px, API simulée).
- Tests SQL/RLS et compatibilité des inscriptions réussis ; npm ci, build et diff --check réussis ; lint 0 erreur et 2 avertissements préexistants.
- La recette connectée antérieure a été réalisée sur documentation-demo ; aucune nouvelle fixture métier créée en production pour cette clôture.

## Migrations de production
Projet : hctvkynrgmnxjynbncdi. Application ciblée avant frontend, sans db push global.

| Fichier source | Version enregistrée par le connecteur |
|---|---|
| 20261005113329_personal_trainer_missions.sql | 20261006102026 |
| 20261005135703_personal_missions_privacy_version_compatibility.sql | 20261006102038 |
| 20261006050812_structure_personal_mission_location.sql | 20261006102048 |

Les noms et contenus des migrations ont été conservés. Les horodatages distants diffèrent des noms des fichiers : réconcilier explicitement l’historique avant tout futur db push, sans réexécuter ces migrations. tutorial_analytics reste hors de ce déploiement ciblé.

Vérification après migration : RLS activée, 3 politiques propriétaires, lecture anon interdite, 4 colonnes d’adresse présentes et droits de saisie authenticated accordés. Les RPC privilégiées gardent leurs contrôles d’identité/appartenance. Les avis Supabase sur les fonctions SECURITY DEFINER sont à interpréter avec ces contrôles ; aucun élargissement des droits n’a été effectué pour supprimer un avis.

## Documentation et périmètre
README, changelogs, roadmaps, documents techniques/fonctionnels/base/décisions, tutoriel et retour au pilotage actualisés. Formation en titre, client final/donneur d’ordre distincts, adresse structurée sans duplication et ajout Mes OF prérempli documentés. FAQ/Découvrir et évolutions envisagées ont été revus : les missions personnelles figurent dans les fonctions disponibles ; les captures sont fictives.

Release : v0.21.1. Le tag cible le commit de clôture documentaire, dont le code applicatif est identique au commit de production ci-dessus. L’archive Clementplane_v0.21.1_Sprint_Closure.zip contient les fichiers suivis de ce commit et SOURCE_COMMIT.txt ; anciens ZIP et fichiers .env exclus. La publication GitHub et ses contrôles finaux sont vérifiables sur la release.

Communication nouveautés : pertinente pour les formateurs, mais différée ; aucun envoi autorisé ou réalisé. Synchronisation Google/Outlook/Apple, statistiques/BPF, facturation et suivi du paiement hors périmètre. Le prochain sprint reste à prioriser au pilotage.

## Revue légale et recette historique
## Revue d’impact légal / RGPD
- Politique de confidentialité et version privacy : catégories de données personnelles et cloisonnement précisés.
- Registre : traitement des missions personnelles ajouté.
- Conservation et droits : table privée incluse ; annulation distincte de l’effacement ; suppression Auth testée en cascade.
- CGU : fonctions de missions/planning et responsabilité de saisie déjà couvertes ; aucune modification contractuelle proposée dans ce sprint.
- Mentions légales : aucune modification nécessaire (éditeur/hébergement inchangés).
- Cookies/traceurs : aucune modification nécessaire, aucun nouveau stockage persistant métier ni traceur.
- Sous-traitants/DPA : aucune modification nécessaire pour ce périmètre ; aucun nouveau prestataire de production.
- Procédure de violation : inchangée ; droits : périmètre de recherche complété.
Cette revue porte sur l’impact fonctionnel du changement, pas sur un nouvel audit juridique global.


Les scripts de reproduction et les choix initiaux sont conservés dans PLAN.md et DESIGN.md ; PR_DRAFT.md est un document historique de préparation.
