# Production V1.7.0 — 17 novembre 2026

Autorisation de Vincent : **« Je valide. Tu peux mettre en production. »** après présentation de la candidate (424 tests et 74 parcours navigateur).

## Sources et migration
- PR https://github.com/Macor77/clementplane/pull/28, tête validée **b3f3144af068b9dc9492e70d165ad207303dfdd5** ; code applicatif final **7b65df3daaa933573d5267b8b47f6fee25c44b26**.
- Quality candidate **44101852870**, job **134103673932**, succès ; statut Vercel preview également réussi avant fusion.
- Fusion main **0ed5582fbd238c79b9611d866ada206ad20a81a6**.
- Migration source **20261117134215_trainer_statistics_goals.sql**, SHA-256 **54e9ba4cbc6706ee2334430098d1cd2f4c50f8c6197cf6a7423f81debc9ccfa7** ; version distante **20261117142308**, nom trainer_statistics_goals. Une seule application, projet clementplane **hctvkynrgmnxjynbncdi**. Aucun db push global.
- Vérification réelle : quatre colonnes NOT NULL, clé propriétaire/mois, FK Auth CASCADE, valeurs/dates/indicateurs contraints, RLS activée, quatre politiques propriétaire + profil formateur, WITH CHECK sur insertion/mise à jour, grants authenticated SELECT/INSERT/UPDATE/DELETE uniquement et aucun SELECT anonyme. Aucun trigger métier. Aucun avis de sécurité visant la nouvelle table.
- Lecture transactionnelle READ ONLY sous authenticated sans identité : aucune ligne visible. Aucun seed/reset, test de mutation métier ou contact d’utilisateur en production. Sauvegarde/restauration fournisseur non observable avec le connecteur, non prétendue.

## Déploiement et contrôle en ligne
- Projet Vercel **prj_gNJbyUiPEIkj5ZPdJozxKbrmD3QE**, déploiement **dpl_hGMR4De7sTDrWJPBZgaPNwrerbft**, cible production, READY, SHA de fusion exact.
- Alias app.clementplane.fr, www.clementplane.fr, clementplane.fr vérifiés.
- HTTP 200 sur `/`, `/formateur/statistiques` et route de mission personnelle à UUID fictif : contrôle du shell SPA, pas d’une session connectée.
- Bundle servi **/assets/index-DWjee6Qz.js**, version **V1.7.0**, SHA-256 **b926b10d65833466e4f7ff2e0bae01aae632068028d2842c84a891a9ccc032a3**, 1 547 554 octets. Présence des objectifs et de la répartition des frais.
- Service worker HTTP 200 et référence au nouveau bundle ; HTML et SW `public, max-age=0, must-revalidate`. Pas de nouvelle installation PWA physique testée.

## Commit documentaire, tag et release
Le tag **v1.7.0** vise le commit documentaire de clôture, sans changement de src, supabase, package/lock, tests ou scripts par rapport à la fusion. Son déploiement doit servir le même bundle et la même empreinte ; contrôle requis avant bilan final.

`.github/workflows/release-v1.7.0.yml` publie seulement après Quality réussi sur ce SHA exact. ZIP complet du commit tagué, SOURCE_COMMIT.txt, manifeste de chaque fichier et sidecar SHA-256. Le workflow télécharge de nouveau les pièces jointes et contrôle empreinte et ouverture avant succès.

Release attendue et à vérifier : https://github.com/Macor77/clementplane/releases/tag/v1.7.0. Aucun e-mail de nouveauté, aucun changement d’agenda, secret, drapeau ou fonction Edge.
