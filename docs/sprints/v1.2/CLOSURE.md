# V1.2 — Livraison conditionnelle, état du 8 octobre 2026

**Sprint non clôturé. PR et release en brouillon. Production inchangée en V1.1.**

## Livré
Synchronisation unidirectionnelle volontaire, calendrier Google dédié, statuts métier, revalidation, multidates, horaires et historique. Événements privés, options d'export désactivées, aucun invité. OAuth serveur/PKCE, jetons chiffrés, file durable, verrous, reprises et rapprochement. Paramètres formateur, accueil missions personnelles, aide et procédures préparés.

## Vérifications
207 tests automatisés, six scénarios navigateur, SQL/RLS, audit et build réussis sur la livraison applicative. Revue indépendante : quatre problèmes importants reproduits et corrigés avec régressions. Lint sans erreur, deux avertissements préexistants. Captures fictives desktop/mobile inspectées ; aucun test Google réel ni OAuth PWA sur appareil validé.

Après autorisation, les deux migrations principales ont été appliquées uniquement à documentation-demo. Neuf contrôles d'intégration SQL et cinq contrôles de notice réussis. Les tests serveur utilisaient des droits sources minimaux temporaires, entièrement annulés avec les fixtures : la démo possède un ancien écart de permissions. Ce résultat ne signifie pas que le worker fonctionne déjà en recette.

Le correctif persistant de permissions est préparé et testé (RED 42501 puis GREEN), mais son application a été refusée avant exécution par auto-review et attend un accord ciblé. Aucun nouveau WARN dans le contrôle sécurité ; trois INFO attendus pour les tables serveur avec RLS sans politique utilisateur. Preuves, limites et correspondances dans [STAGING.md](STAGING.md).

## Références
- Branche : feature/v1.2-google-calendar ; PR brouillon : https://github.com/Macor77/clementplane/pull/5 .
- Base main et production auditée : 5f4ef5066f1130ccb76565e8e42236acb3f8668a, V1.1 / v1.1.0.
- Commit applicatif initial publié : dde67f26c0db97e138095af2b0438b77957b48b1. Premier ensemble intégralement vert : 45c12ce1db380de626cfac456435061423bc20de. Point de sauvegarde : 3bf84508af23b117e14522b0009d8bf587d09a44. Correctif de permissions et recette SQL : 3851f871ab56d0ca76a719c179a479e840453f14.
- CI applicative vérifiée : https://github.com/Macor77/clementplane/actions/runs/37737796659 . CI du correctif : https://github.com/Macor77/clementplane/actions/runs/37743245393 .
- Release enregistrée en brouillon, préversion, archive jointe : https://github.com/Macor77/clementplane/releases/tag/untagged-4c58d7bb2695088cbd25 . Tag prévu v1.2.0-beta.1, à créer lors de la publication ; aucun tag V1.2 publié.

## Environnements
Production hctvkynrgmnxjynbncdi : lectures de contrôle uniquement. Recette jqhbrkyeawtsuzrzrnvm / documentation-demo : migrations google_calendar_sync et google_calendar_privacy_notice appliquées, respectivement versions 20261008071104 et 20261008071114. Troisième correctif local 20261008072003_google_calendar_service_read_access.sql non appliqué. Aucun reset ou rejeu global.

Aucune fonction Google ni scheduler déployés. Aucun secret/client OAuth configuré dans cette session. Google Cloud affiche Site Unavailable dans le navigateur après rechargement ; cause non établie. Aucun compte Google réel testé.

## Sauvegarde
Clementplane-V1.2-preparation-2026-10-08.zip, jointe à la release : fichiers modifiés au commit 3bf8450, patch de restauration vérifié contre V1.1, captures fictives et manifeste. SHA-256 : 4d0637408f665205428f412fe3ab4d3ace39f0415114592da205c89dad73a24c. Aucun .env, base de données, jeton, journal ou pièce métier réelle. Cette archive reste un point de sauvegarde antérieur aux compléments de recette ; ceux-ci sont versionnés dans la PR. Archive finale à produire après recette Google complète.

## Étapes bloquantes
Autoriser le correctif serveur minimal sur documentation-demo ; vérifier ensuite la lecture sans droits temporaires. Configurer Google Cloud/OAuth et les testeurs autorisés, puis fonctions/cron de recette. Qualifier droits de partage, absence d'invitations, fonctionnement navigateur fermé et PWA. Valider RGPD, journaux callback et audience/publication Google. Accord final explicite avant fusion, production ou publication.

Aucune nouvelle dépense engagée. Mesurer consommation/quotas avant montée en charge. La récupération manuelle d'une création de calendrier incertaine et le bref chargement après refus OAuth restent documentés. Priorité de roadmap : achever la qualification Google avant d'autres fournisseurs. Voir OPERATIONS.md, ACCEPTANCE.md et RETOUR_PILOTAGE.md.
