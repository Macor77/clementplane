# Recette V1.6.0 — 16 novembre 2026

## Vérifié localement

- 413 tests unitaires/contrats, 61 fichiers : réussis.
- Suite PostgreSQL PGlite de participation partielle : réussie. Inclut contrat inclusif 4/1 (3 complets), 4/4 (0 complet), suppression, sauvegarde privée, contrôles RLS/OF/autres formateurs/anonyme, CAS/retry et absence de trigger calendrier.
- Build production : réussi. Lint : aucune erreur, deux avertissements Hooks préexistants dans usePlanningAvailability et TrainerSearch.
- Revue indépendante : deux problèmes historiques corrigés (reclassement implicite lors d’une observation et blocage des statuts non réalisés). Aucun point concret restant ; 55 tests ciblés réussis.

## Navigateur et CI

Quality **43873670898**, job **133321045866**, réussi sur le commit applicatif **280a2746ec02bbbbf293ea47328a420b6bd41afc** (merge de recette **f8ccffd7de62a68348cc6bd1b4f625e6db1ee3d6**). **413 tests unitaires/contrats et 67 parcours navigateur réussis**, toutes les suites SQL/RLS, lint, audit et build réussis. Scénarios 14–18 et non-régression existante. Le scénario 18 couvre ancien bilan simple 4 → 3 + 1, enregistrement/rechargement, modification indépendante, zéro complet, ajout/suppression, durées inconnues, statistiques, confidentialité et historique détaillé. Deux largeurs : 1440 et 390 px. API simulée, données fictives uniquement. Les aides disposent déjà d’une recette 1440/768/390 px conservée dans le scénario 17.

Le navigateur local est indisponible dans l’environnement d’exécution ; les essais navigateur sont exécutés dans GitHub Actions. Ils ne remplacent ni une recette sur smartphone physique/PWA installée, ni une écriture métier réelle en production. Aucune base hébergée modifiée ; les tests SQL locaux ne prouvent pas un nouvel état Supabase déployé.

## Critères vérifiés

Les deux décomptes sont séparés dans la saisie, la lecture OF et les statistiques. Le total additionne les deux une seule fois. Les anciennes données, les frais/kilomètres/difficultés et les autres champs survivent aux modifications. Aucune conversion jours/heures, aucun changement de temps animé, permissions, calendrier, facturation ou export BPF.

## Preuves examinées

- [Quality](https://github.com/Macor77/clementplane/actions/runs/43873670898) et [PR #27](https://github.com/Macor77/clementplane/pull/27), désormais fusionnée après validation.
- Quatre captures 1440/390 px examinées : formulaire et statistiques affichent 3 complets, 1 partiel, total 4 ; heures animées 3,5 inchangées, contrôles accessibles et aucun débordement horizontal. Copies fictives durables : [bilan mobile](assets/bilan-mobile.png), [statistiques mobiles](assets/statistiques-mobile.png). La barre fixe visible dans une capture pleine page reflète la position de défilement au moment de la capture.
- Audit : 12 vulnérabilités préexistantes (3 faibles, 9 modérées), aucune haute/critique ; aucun changement de dépendances. Avertissement de taille du bundle préexistant.
- Vercel preview **dpl_CQ9kNPCXwutLdeui4iaDdNHryLvQ**, READY, commit applicatif exact. URL protégée : le contrôle HTTP redirige vers la connexion Vercel ; ce n’est pas une preuve de parcours connecté sur ce déploiement.
- Archive candidate du premier commit téléchargée et vérifiée : 707 entrées, version 1.6.0, provenance f8ccffd7de62a68348cc6bd1b4f625e6db1ee3d6 ; SHA-256 **6a84532492d565bf5c9572da4de3a67547b131f7e23a5d28d4fe0a9426950bb2**. ZIP, chaque entrée du manifeste et sidecar SHA-256 vérifiés. Le complément de preuves documentaire ne change pas l’application ; Quality régénère une archive de son commit exact.

## Livraison autorisée

Candidate documentaire 60f3aefc6cdc3c1e60e750a22971304beeca6ee7 : Quality **43874641015** réussi (413 tests/67 parcours). Son archive de 709 entrées a été téléchargée, ouverte et vérifiée entrée par entrée ; source de recette 6d725969dfdde59dc64734b9710eb96271f7a63e, SHA-256 **90b6880d3863515878e6aff814ced5075c4bd361f140082bd3de56f3d404379c**.

Accord de production explicite reçu le 16 novembre. PR #27 fusionnée en **3e92d588537d3fe0df1279dd6824fdede734c252**, Quality main **43876479305**. Déploiement Vercel READY et bundle V1.6.0 contrôlés sur l’origine officielle ; portée exacte dans PRODUCTION.md. Aucun test métier avec écriture de données réelles. Le commit documentaire de clôture ne modifie pas l’application ; sa release est conditionnée à Quality sur ce commit exact, puis vérifie le téléchargement du ZIP et son empreinte.
