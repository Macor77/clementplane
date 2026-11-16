# V1.5.0 — Non clôturé, candidate validée techniquement

Développement réalisé sur `feature/v1.5.0-partial-attendance`, base `a74980022e673840e6c6b423ffe5d8ce9aedb8ba` (production V1.4.0). Base de démonstration migrée ; aucun déploiement, tag ou release de production.

Code, modèle, migration additive, tests et documentation préparés. Contrôles locaux : 406 tests unitaires, quatre suites SQL activité, lint sans erreur et build réussi. Revue indépendante effectuée : aucun défaut bloquant confirmé. Réouverture du volet sur répétition de la même erreur renforcée et couverte par la recette navigateur. CI Quality 43821510095 réussie sur le commit applicatif `4c1583058c6988ffdd7224228bf59f97970f6b19` : 58 tests navigateur, captures desktop/tablette/mobile examinées. [PR #25 en brouillon](https://github.com/Macor77/clementplane/pull/25).

Recette hébergée réussie le 16 novembre après autorisation explicite de Vincent : migration demo `20261116095029`, PostgreSQL/RLS et rollback des données fictives vérifiés. Dernière CI applicative/documentaire eb1bad0 : Quality 43822206255 réussie.

Restant : validation de production, fusion/déploiement, vérification live et clôture tag/release/archive définitive. Archive candidate construite, téléchargée et vérifiée (détails ACCEPTANCE.md), distincte de la future archive de release.

Voir ACCEPTANCE.md, OPERATIONS.md, LEGAL_REVIEW.md et COMMUNICATION.md pour le statut de chaque obligation. Aucun compromis de confidentialité accepté.
