# V1.2 — recette SQL

État au 8 octobre 2026 : trois migrations appliquées sur un environnement isolé après autorisations explicites. Production inchangée. Recette Google réelle non réalisée.

## Migrations appliquées
| Fichier versionné | État en recette |
| --- | --- |
| 20261008054625_google_calendar_sync.sql | appliquée |
| 20261008061224_google_calendar_privacy_notice.sql | appliquée |
| 20261008072003_google_calendar_service_read_access.sql | appliquée après accord complémentaire |

Les identifiants d'infrastructure et correspondances de versions distantes sont conservés dans le rapport privé du titulaire. Aucun reset ni rejeu global de l'historique. Vérifier ce rapport avant toute opération de migration.

## Résultats
Neuf contrôles d'intégration passent avec les droits permanents, sans grants temporaires sur les sources :
- refus des accès des rôles publics aux tables et RPC serveur ;
- lecture des missions des formateurs fictifs et isolation entre propriétaires ;
- restauration du contexte JWT ;
- exclusion des verrous worker/commande et rejet d'un verrou étranger ;
- déclencheur depuis une écriture authentifiée et conservation d'une modification concurrente ;
- RLS et protection du schéma privé.

Le script reproductible `supabase/operations/google-calendar-demo-acceptance.sql` vérifie les prérequis de permissions et les domaines fictifs, puis annule toutes ses écritures de test. Aucun compte, jeton Google ou événement calendrier n'est créé durablement. Les fixtures et acceptations légales restent inchangées.

Les cinq contrôles de notice réussis auparavant restent valides : trois versions de notice acceptées et enregistrées, consentement CGU manquant et version inconnue refusés.

## Permissions minimales
Le correctif accorde uniquement au rôle serveur SELECT sur trainers(id, user_id) et missions(id, statut, adresse), ainsi qu'EXECUTE sur les trois RPC de lecture déjà utilisées. Aucun droit navigateur ou UPDATE ajouté. Le snapshot reste SECURITY INVOKER. L'absence de droit SELECT global sur trainers et de droit UPDATE sur missions est vérifiée.

Le test local avait reproduit l'absence de permissions (42501), puis réussi avec le correctif. La recette réelle confirme désormais son application persistante. CI [37743245393](https://github.com/Macor77/clementplane/actions/runs/37743245393) et [37743876956](https://github.com/Macor77/clementplane/actions/runs/37743876956) réussies, tests navigateur inclus.

## Fonctions et configuration Google
Les fonctions `google-calendar` et `google-calendar-worker` sont déployées en version 1, statut ACTIVE, uniquement sur la recette. La première conserve la vérification JWT ; le worker contrôle son secret dédié dans le handler. Les deux appels POST sans authentification retournent HTTP 401. Aucun secret ajouté ni cron installé à ce stade ; ces contrôles ne valident pas encore un parcours authentifié ou Google.

Les captures transmises par le titulaire confirment un projet Google dédié, Calendar API activée, une audience externe avec un testeur et les seuls scopes openid, email et calendar.app.created enregistrés. Le titulaire a ensuite transmis l’identifiant du client Web créé. Le secret reste hors conversation. La persistance de l’URI de retour exacte, le statut Testing et les exigences de vérification restent à contrôler.

## Suite
Enregistrer les secrets directement dans Supabase, raccorder la préversion Vercel à la base isolée, contrôler l’accès au callback, puis installer le cron et réaliser la recette Google autorisée. Google Cloud reste inaccessible dans le navigateur de cette session ; le titulaire effectue sa configuration depuis son propre navigateur. Aucune disponibilité publique à annoncer. PR et release restent en brouillon.
