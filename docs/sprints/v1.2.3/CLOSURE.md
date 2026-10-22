# V1.2.3 — État de livraison

**Clôturé — V1.2.3 livrée en production, archive vérifiée.** 22 octobre 2026.

| Exigence | État et preuve | Environnement / suite |
|---|---|---|
| Deux parcours, accepter/refuser | Vérifié par tests SQL exécutant les RPC existantes | PGlite local, aucune mission réelle modifiée |
| Réponse indépendante du navigateur | Trigger transactionnel testé, rollback vérifié | SQL local et migration de production |
| Reprises et doublons | Worker simulé + claim/verrou SQL, état uncertain sans renvoi aveugle | Local ; Brevo réel non sollicité |
| Sécurité | RLS, accès table et claim refusés anon/authenticated ; service_role autorisé | Vérifié en production, mauvais secret HTTP 401, schéma net non exposé |
| Supabase | Migration ciblée `20261022070841`, worker v14, cron actif | Production, aucun rattrapage historique |
| Qualité / CI | 245 tests, suites SQL, audit et build réussis ; 18 tests navigateur réussis | CI PR 39737701498 et main 39738670834 réussies |
| Production / version | 1.2.3, Vercel READY et domaine app.clementplane.fr | Commit 871e868cc918185dd012fa5599f91f608f091e41 |
| GitHub / tag / release / archive | PR #15 fusionnée, tag v1.2.3, ZIP et SHA-256 publiés et vérifiés | Release 39738898593 réussie |
| Communication | E-mail de nouveauté inutile pour un rétablissement de comportement | Aucun envoi ni sollicitation partenaire |
| Aide / évolutions / landing | Promesses existantes déjà exactes ; aucun nouvel écran | Version affichée mise à jour, captures et tutoriels inchangés |
| Documentation | Plan, exploitation, fonctionnel, architecture, données, tests, décisions, roadmap et changelogs | Mis à jour avec le correctif |
| Pilotage | RETOUR_PILOTAGE.md actualisé | Ne démarre aucun sprint suivant |

## Impact légal et confidentialité — revue technique
CGU : règle métier et finalité inchangées. Confidentialité publique : communications opérationnelles et prestataires déjà décrits ; pas de nouvelle catégorie ou destinataire, aucun changement nécessaire. Mentions légales et traceurs : inchangés (pas de traceur, opérateur ou stockage navigateur nouveau). Registre et politique de conservation : ajout de la file technique et de sa purge à 30 jours. Droits : ajouter la file aux recherches et à l'effacement, cascade par relation. Sous-traitants/DPA : même Supabase/Brevo, pas de nouveau contrat certifié par cette revue. Procédure de violation : cadre existant applicable, pause du worker documentée. Les réserves historiques Google Agenda restent hors périmètre et ne sont pas réputées levées.

## Portée
Les tests de transport sont simulés. Dry-run de production réussi pour authentification/configuration/lectures/rendu sans envoi ; il ne prouve pas la réception d'un nouveau mail réel. Aucun rattrapage automatique des anciennes réponses (dont le signalement initial). Les cas ambigus nécessitent réconciliation pour préserver l'absence de doublons.

## Vérifications locales — 22 octobre 2026

245 tests réussis (45 fichiers), dont 19 nouveaux tests de notifications ; suites SQL missions personnelles/versions légales/Google Agenda réussies. Lint : aucune erreur, deux avertissements préexistants (usePlanningAvailability, TrainerSearch). Audit : Vite 7.3.6 comportait une vulnérabilité high bloquant le gate ; mise à jour ciblée vers 7.3.7, aucun high/critical restant, trois moderate préexistantes Vitest/mocker/coverage hors périmètre. Build Vite/PWA réussi, avertissement habituel taille du bundle. Installation locale Chromium échouée (archive fournie tronquée) : recette navigateur requise via CI, sans prétendre à une réussite locale.

## Historique du blocage de publication — levé le 22 octobre 2026

Commit local applicatif : `11e12bc09436ba2a55848318001172632eec3618`. Les 32 fichiers ont été vérifiés avant publication : aucun secret ni identifiant personnel de l'incident ajouté, données de test fictives. Le dépôt a été vérifié par le connecteur : Macor77/clementplane, public, droits push/admin ; main `b245d93dc62c8b0947c2bb981c93c0f5b1d1f62c`, identique à la base locale.

Premier push refusé pour destination non vérifiée ; après vérification, nouvel essai autorisé mais échec d'authentification Git CLI. Le connecteur a créé l'arbre `1e43a99535e00e2c1f43db2195049bd6d66104eb`, puis la revue automatique a refusé la création du commit, exigeant une autorisation explicite de publication du code dans ce dépôt public. Aucun contournement effectué. Pas de branche/PR publiée, de fusion, migration, déploiement serveur, cron, tag ou release. La version en ligne est inchangée.

Action minimale : Vincent autorise explicitement la publication du correctif dans le dépôt public Macor77/clementplane ; reprendre ensuite PR/CI, livraison et clôture. La CI distante, les tests navigateur et le dry-run serveur restent à effectuer. Les contrôles locaux réussis ne sont pas présentés comme une recette de production.

## Autorisation reçue — 22 octobre 2026

Vincent a explicitement autorisé la publication du correctif dans le dépôt public Macor77/clementplane et sa mise en production après validation des contrôles restants. Le blocage précédent est levé ; reprise de la livraison.

## Correction du contrôle navigateur

La première CI PR (39737144757) passe les 245 tests, SQL, audit et build, puis échoue sur 2 des 18 tests navigateur : les missions fictives des 20/21 du mois sont passées au 22 octobre et ne figurent plus dans la prochaine mission du tableau de bord. Horloge navigateur fixée au 10 du même mois dans cette recette ; les assertions métier sont conservées. Aucun changement applicatif associé. Nouvelle CI 39737701498 réussie : 18 tests navigateur sur 18.

## Preuves de production — 22 octobre 2026

- PR [#15](https://github.com/Macor77/clementplane/pull/15), fusion squash `871e868cc918185dd012fa5599f91f608f091e41`. Publication publique et production explicitement autorisées avant exécution.
- CI PR [39737701498](https://github.com/Macor77/clementplane/actions/runs/39737701498) réussie : 245 tests, suites SQL, audit, build et 18 tests navigateur. Le premier échec et sa correction de date sont documentés ci-dessus.
- Une seule migration appliquée : locale `20261022061649_mission_response_outbox.sql`, version distante `20261022070841`, nom `mission_response_outbox`. Aucun db push global ; identifiant distant généré par le connecteur. SQL local/distant identique (MD5 `9734b7872171a82f1cdf72d27cfdd3f8`).
- Fonction `notify-mission-response` v14 ACTIVE, empreinte `518dae5a0fda44f2afa1610caf6ba7af658e8e0fd674a0ea1871f38b80f6d34d`. Authentification serveur conservée. Dry-run HTTP 200 : success/dryRun/recipientResolved/contentReady vrais, alreadyNotified nul. Aucune mission modifiée, aucun mail envoyé par ce contrôle. La première relation sélectionnée ayant changé de statut, elle a correctement renvoyé 409 ; contrôle ensuite effectué sur une réponse toujours acceptée/refusée.
- Cron `clementplane-mission-responses`, job 2, toutes les minutes ; première exécution réussie à 07:11 UTC, réponse worker HTTP 200, success vrai, processed 0. File vide à l'activation : aucun rattrapage historique.
- RLS activée ; droits SELECT et claim refusés anon/authenticated, claim autorisé service_role. Mauvais secret HTTP 401. Test Data API du schéma net : HTTP 406 PGRST106, seuls public/graphql_public exposés. L'avis « RLS sans policy » de l'outbox est intentionnel : table strictement serveur, aucun accès navigateur requis. Les avis historiques ne sont pas déclarés corrigés.
- Vercel `dpl_3EHU8p41Vb8BSEgw5SWpTMHh1yM1`, READY, target production, commit de fusion exact ; alias app.clementplane.fr affecté. Lecture HTTPS `/decouvrir` : HTTP 200, bundle `/assets/index-3KTXNh4R.js` contenant la version 1.2.3.

La recette ne constitue pas une preuve de réception d'un nouveau mail par un destinataire réel. Cette vérification reste observationnelle lors d'une prochaine réponse utilisateur ; les essais fournisseur des tests sont simulés. Surveillance et reprise ciblée : OPERATIONS.md.

## Release et clôture

CI main [39738670834](https://github.com/Macor77/clementplane/actions/runs/39738670834) réussie. Workflow release [39738898593](https://github.com/Macor77/clementplane/actions/runs/39738898593) réussi, y compris téléchargement et validation SHA-256/ZIP de l'archive publiée.

[Release v1.2.3](https://github.com/Macor77/clementplane/releases/tag/v1.2.3), tag vérifié sur `871e868cc918185dd012fa5599f91f608f091e41`. Archive `Clementplane_v1.2.3_Sources.zip`, SHA-256 `7584279ad54d631434527a33926577f058a8ba5100fd62b0b66fd892e0e3d849`, fichier de somme joint. Les sources et le manifeste sont ceux du commit de livraison ; ce bilan final est un complément documentaire ultérieur, sans déplacement du tag ni remplacement de l'archive.

Correctif livré et sprint clos avec la limite de recette explicitée ci-dessus (aucun envoi réel déclenché pour les tests). Les suivis opérationnels ne bloquent pas cette livraison et ne ferment pas les réserves des sprints précédents.
