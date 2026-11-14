# Publication V1.3.2 — 14 novembre 2026

Vincent autorise explicitement la publication et la migration après présentation de la version testée. Aucun e-mail autorisé ni envoyé.

## Intégration et déploiement
- PR [#23](https://github.com/Macor77/clementplane/pull/23), tête `28b3377bff98fff16bb4a3937239babbe8239c59`, fusionnée dans main : `a611276b7c30ad8380761674416e51838f64dd3e`.
- Base main inchangée depuis la recette (`a339c4a`). Quality de PR [43635325119](https://github.com/Macor77/clementplane/actions/runs/43635325119) réussie : 367 tests unitaires et 49 parcours navigateur, toutes suites SQL, lint, audit, build et archive.
- Vercel production `dpl_Qg8v9s5dTbJd5aAdujdDmc944jtP`, READY, commit a611276b, domaines app.clementplane.fr / www.clementplane.fr / clementplane.fr. Aucun drapeau ne limite le bilan simplifié aux testeurs.
- Quality de main [43635836882](https://github.com/Macor77/clementplane/actions/runs/43635836882). Le complément de clôture reste strictement documentaire et ajoute le workflow de release ; il ne change pas le code applicatif.

## Base et intégrité
Projet Supabase `hctvkynrgmnxjynbncdi`, clementplane, ACTIVE_HEALTHY. Migration absente avant application, appliquée une seule fois sous `20261114200754_simplify_trainer_activity` ; source `20261114194307_simplify_trainer_activity.sql`. Recette : version `20261114195629` sur documentation-demo. Aucun db push global ni reprise d’autres migrations.

Un bilan existant avant/après ; empreinte agrégée de son détail sessions inchangée : `5a847ed90159446a0c27cfa74034b2d6`. Aucune valeur de bilan réel extraite dans les preuves, aucune réalisation créée à la place d’un utilisateur. Migration transactionnelle additive ; sessions, champs privés et champs existants conservés. Aucun export de données privées ni prétention à une restauration de sauvegarde fournisseur testée.

Les fonctions déployées correspondent exactement à la recette (MD5 de prosrc pour comparaison) : save_report `82a52af9ce0ce2bd17a6b90e0f3ca3b1`, validate_summary `94d7e9a190404698e95cf41c552fc167`.

RLS activée sur les deux tables, authenticated SELECT sous RLS uniquement, aucune écriture directe INSERT/UPDATE. Une transaction sous identité fictive sans profil ne lit aucune ligne et la RPC refuse REPORT_ACCESS_DENIED ; ROLLBACK. Advisor sécurité : aucun constat sur trainer_activity ou activity_private ; alertes préexistantes hors périmètre.

## Vérification des fichiers en ligne
HTTP 200 sur l’origine officielle et les shells des routes statistiques, bilan conservé et mission. Asset `https://app.clementplane.fr/assets/index-omd8NScr.js` : V1.3.2, jours/heures réels et nouveau format présents. API anonyme : HTTP 401 / 42501 sur les deux tables.

Ces contrôles prouvent la disponibilité des fichiers, le déploiement et les refus d’accès ; ils ne remplacent pas une saisie authentifiée sur appareil installé. Les 49 parcours utilisent Chromium et des API simulées ; PostgreSQL réel a été testé en recette. Aucun compte partenaire sollicité, aucun envoi, aucune modification des agendas ou du pilote Outlook.

## Release et archive
Le commit de clôture dont le message contient `release-v1.3.2` déclenche Quality puis le workflow `Release V1.3.2 sources`. Celui-ci contrôle la version et Quality sur le commit exact, crée l’archive et son manifeste, publie le tag/release puis télécharge les pièces jointes et vérifie leur SHA-256 et intégrité ZIP. Le tag donne le commit exact ; son code applicatif est identique à a611276b. Ne pas déplacer le tag.

[Release v1.3.2](https://github.com/Macor77/clementplane/releases/tag/v1.3.2) · [Workflow de release](https://github.com/Macor77/clementplane/actions/workflows/release-v1.3.2.yml)
