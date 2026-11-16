# V1.5.1 — Candidate validée, non clôturé : production à valider

État au 16 novembre 2026. Développement autorisé, réalisé et testé. La V1.5.0 demeure la version de production. PR [#26](https://github.com/Macor77/clementplane/pull/26), maintenue en brouillon. Commit applicatif `873d3ffde95f253b14c0f68c6898bc01a0a44f97`.

| Obligation | État / preuve / action restante |
|---|---|
| Périmètre et conception | Vérifié : DESIGN.md, aides contextuelles avec contenu conservé, mentions essentielles directes |
| Développement | Vérifié : branche feature/v1.5.1-activity-help, commit applicatif et revue indépendante sans anomalie importante |
| Recette, CI, accessibilité/mobile | Vérifié : ACCEPTANCE.md ; Quality 43857208016, 406 unitaires, 63 navigateur, captures contrôlées |
| Supabase | Preuve antérieure applicable V1.5.0 et suites SQL/RLS réussies : aucun changement schéma/API/RLS ; aucune migration ni opération hébergée nécessaire |
| Production | À faire après validation de Vincent : fusion, contrôle Vercel/version et disponibilité ; preview READY protégée, aucune recette live revendiquée |
| Documentation fonctionnelle / architecture / base / dépannage | Vérifié : GUIDE.md, OPERATIONS.md et docs de référence actualisés ; modèle de données inchangé |
| Impact légal | Vérifié : LEGAL_REVIEW.md, aucune modification des traitements ni nouvelle acceptation |
| Roadmap / changelog / décisions | Vérifié : racine et docs identifient la candidate, historique conservé |
| Version technique/UI | Vérifié dans les sources et le build : 1.5.1 / V1.5.1 ; production reste V1.5.0 |
| GitHub | Code poussé et PR brouillon #26 ; fusion en attente de validation, aucune approbation GitHub inventée |
| Tag / release | À faire après validation et livraison ; aucun tag historique déplacé |
| Archive | Vérifié : candidate Quality téléchargée, ZIP/manifeste/provenance contrôlés dans ACCEPTANCE.md ; archive de release finale après livraison |
| Découvrir / FAQ / tutoriels / captures / landing / évolutions | Vérifié : COMMUNICATION.md ; FAQ et tutoriel actualisés, captures fictives contrôlées, pas de nouvelle promesse commerciale |
| Communication utilisateurs | Non applicable justifié : amélioration directement accessible, e-mail inutile ; aucun envoi |
| Pilotage | Vérifié : RETOUR_PILOTAGE.md ; clôture finale après livraison |

Restant : accord pour publier cette évolution, puis fusion/déploiement, contrôle de production et finalisation du tag/release/archive. Aucun besoin d’intervention dans Supabase.
