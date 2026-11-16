# Recette V1.6.0 — candidate du 16 novembre 2026

## Vérifié localement

- 413 tests unitaires/contrats, 61 fichiers : réussis.
- Suite PostgreSQL PGlite de participation partielle : réussie. Inclut contrat inclusif 4/1 (3 complets), 4/4 (0 complet), suppression, sauvegarde privée, contrôles RLS/OF/autres formateurs/anonyme, CAS/retry et absence de trigger calendrier.
- Build production : réussi. Lint : aucune erreur, deux avertissements Hooks préexistants dans usePlanningAvailability et TrainerSearch.
- Revue indépendante : deux problèmes historiques corrigés (reclassement implicite lors d’une observation et blocage des statuts non réalisés). Aucun point concret restant ; 55 tests ciblés réussis.

## Navigateur et CI

À compléter après Quality : scénarios 14–18 et non-régression existante. Le scénario 18 couvre ancien bilan simple 4 → 3 + 1, enregistrement/rechargement, modification indépendante, zéro complet, ajout/suppression, durées inconnues, statistiques, confidentialité et historique détaillé. Deux largeurs : 1440 et 390 px. API simulée, données fictives uniquement. Les aides disposent déjà d’une recette 1440/768/390 px conservée dans le scénario 17.

Le navigateur local est indisponible dans l’environnement d’exécution ; les essais navigateur sont exécutés dans GitHub Actions. Ils ne remplacent ni une recette sur smartphone physique/PWA installée, ni une écriture métier réelle en production. Aucune base hébergée modifiée ; les tests SQL locaux ne prouvent pas un nouvel état Supabase déployé.

## Critères attendus

Les deux décomptes sont séparés dans la saisie, la lecture OF et les statistiques. Le total additionne les deux une seule fois. Les anciennes données, les frais/kilomètres/difficultés et les autres champs survivent aux modifications. Aucune conversion jours/heures, aucun changement de temps animé, permissions, calendrier, facturation ou export BPF.
