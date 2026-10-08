# V1.2 — Livraison conditionnelle, état du 8 octobre 2026

**Sprint non clôturé. PR et release en brouillon. Production inchangée en V1.1.**

## Livré
Synchronisation unidirectionnelle volontaire, calendrier Google dédié, statuts métier, revalidation, multidates, horaires et historique. Événements privés, options d'export désactivées, aucun invité. OAuth serveur/PKCE, jetons chiffrés, file durable, verrous, reprises et rapprochement. Paramètres formateur, accueil missions personnelles, aide et procédures préparés.

## Vérifications
207 tests automatisés, six scénarios navigateur, SQL/RLS, audit et build réussis sur la livraison applicative. Revue indépendante : quatre problèmes importants reproduits et corrigés avec régressions. Lint sans erreur, deux avertissements préexistants. Captures fictives desktop/mobile inspectées ; aucun test Google réel ni OAuth PWA sur appareil validé.

Après autorisations, les trois migrations ont été appliquées uniquement sur un environnement isolé de recette. Neuf contrôles d'intégration SQL et cinq contrôles de notice réussis. Les neuf contrôles serveur ont été relancés avec succès après le correctif permanent, sans permissions sources temporaires ; toutes les écritures de test ont été annulées. Les deux fonctions Google sont désormais déployées sur la recette ; secrets et scheduler sont configurés et vérifiés, raccordement Vercel toujours attendu.

Le correctif persistant de permissions (RED 42501 puis GREEN) a été appliqué après accord ciblé : cinq colonnes en lecture et trois RPC exécutables par le rôle serveur uniquement. Le contrôle sécurité des deux premières migrations n'a ajouté aucun WARN ; trois INFO attendus pour les tables serveur avec RLS sans politique utilisateur. Preuves, limites et correspondances dans [STAGING.md](STAGING.md).

## Références
- Branche : feature/v1.2-google-calendar ; PR brouillon : https://github.com/Macor77/clementplane/pull/5 .
- Base main et production auditée : 5f4ef5066f1130ccb76565e8e42236acb3f8668a, V1.1 / v1.1.0.
- Commit applicatif initial publié : dde67f26c0db97e138095af2b0438b77957b48b1. Premier ensemble intégralement vert : 45c12ce1db380de626cfac456435061423bc20de. Point de sauvegarde : 3bf84508af23b117e14522b0009d8bf587d09a44. Correctif de permissions et recette SQL : 3851f871ab56d0ca76a719c179a479e840453f14.
- CI applicative vérifiée : https://github.com/Macor77/clementplane/actions/runs/37737796659 . CI du correctif et du commit documentaire suivant, toutes deux réussies : https://github.com/Macor77/clementplane/actions/runs/37743245393 et https://github.com/Macor77/clementplane/actions/runs/37743876956 .
- Release enregistrée en brouillon, préversion, archive jointe : https://github.com/Macor77/clementplane/releases/tag/untagged-4c58d7bb2695088cbd25 . Tag prévu v1.2.0-beta.1, à créer lors de la publication ; aucun tag V1.2 publié.

## Environnements
Production : lectures de contrôle uniquement. Les trois migrations calendrier sont appliquées dans l'environnement isolé de recette. Identifiants et correspondances de versions distantes conservés dans le rapport privé du titulaire. Aucun reset ou rejeu global.

Les fonctions `google-calendar` et `google-calendar-worker` sont déployées en version 1, statut ACTIVE, uniquement sur la recette. La première conserve la vérification JWT ; le worker contrôle son secret dédié dans le handler. Les deux appels POST sans authentification retournent HTTP 401. Les huit paramètres Edge sont maintenant enregistrés sur la recette. L’identifiant client a été contrôlé par empreinte ; la valeur du secret Google n’a pas été lue. Le mode testing est limité aux deux comptes Clementplane fictifs. Les clés indépendantes de chiffrement et du worker ont été générées avec 32 octets aléatoires, conservées dans Vault et copiées dans les secrets Edge ; leurs empreintes concordent. Le scheduler est actif à une minute. Un déclenchement planifié et les réponses HTTP 200 du worker avec processed: 0 sont vérifiés ; zéro connexion et zéro événement Google. Cela valide le circuit scheduler → worker → base, pas OAuth ni la synchronisation réelle.

Les captures transmises par le titulaire confirment un projet Google dédié, Calendar API activée, une audience externe avec un testeur et les seuls scopes openid, email et calendar.app.created enregistrés. Le titulaire a ensuite transmis l’identifiant du client Web créé. Le secret reste hors conversation. La persistance de l’URI de retour exacte, le statut Testing et les exigences de vérification restent à contrôler. Google Cloud reste inaccessible dans le navigateur de cette session. Aucun compte Google réel testé.

## Sauvegarde
Clementplane-V1.2-preparation-2026-10-08.zip, jointe à la release : fichiers modifiés au commit 3bf8450, patch de restauration vérifié contre V1.1, captures fictives et manifeste. SHA-256 : 4d0637408f665205428f412fe3ab4d3ace39f0415114592da205c89dad73a24c. Aucun .env, base de données, jeton, journal ou pièce métier réelle. Cette archive reste un point de sauvegarde antérieur aux compléments de recette ; ceux-ci sont versionnés dans la PR. Archive finale à produire après recette Google complète.

## Étapes bloquantes
Raccorder la préversion Vercel à la base isolée, contrôler l’accès au callback et réaliser la recette Google autorisée. L’intégration Vercel n’est pas encore connectée. Qualifier droits de partage, absence d'invitations, fonctionnement navigateur fermé et PWA. Valider RGPD, journaux callback et audience/publication Google. Accord final explicite avant fusion, production ou publication.

Aucune nouvelle dépense engagée. Mesurer consommation/quotas avant montée en charge. La récupération manuelle d'une création de calendrier incertaine et le bref chargement après refus OAuth restent documentés. Priorité de roadmap : achever la qualification Google avant d'autres fournisseurs. Voir OPERATIONS.md, ACCEPTANCE.md et RETOUR_PILOTAGE.md.
