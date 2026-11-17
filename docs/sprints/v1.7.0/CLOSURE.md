# V1.7.0 — Candidat en développement, 17 novembre 2026

Statistiques formateur adaptées au téléphone : CA réalisé HT/TTC, frais privés par catégorie et dépense, détails par mission, périodes et filtres, évolution/comparaison, bilans à compléter avec fin de session, objectif mensuel privé.

Développement autorisé par Vincent. **Pas de fusion ni de déploiement en production autorisés pour cette version.** La version en production reste V1.6.0.

| Contrôle | État |
|---|---|
| Périmètre / décisions | Plan validé par la demande utilisateur ; règles détaillées dans docs/superpowers/plans/2026-11-17-mobile-statistics.md |
| Calculs et services | 424 tests unitaires/contrats réussis localement |
| SQL / confidentialité | Toutes les suites activity SQL/RLS réussies, y compris les objectifs |
| Migration | 20261117134215_trainer_statistics_goals.sql, additive ; non appliquée sur environnement hébergé |
| Interface / navigateur | Parcours 19 ajoutés, contrôle CI et examen visuel en cours |
| Revue indépendante | En cours |
| Lint / build | Lint sans erreur, deux avertissements préexistants ; build réussi |
| Archive / PR | À produire depuis le commit candidat |
| Production / tag / release | Non exécutés ; validation de production nécessaire après recette |

Les tests navigateur utilisent des données fictives et des réponses API simulées. Les politiques SQL sont exécutées sur PostgreSQL embarqué PGlite, pas déduites de mocks. Aucun test physique de téléphone, aucune écriture métier en production, aucun e-mail ni événement calendrier.
