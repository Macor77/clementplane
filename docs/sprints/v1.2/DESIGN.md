# V1.2 — Synchronisation Google Agenda (préproduction)

## Intention et autorisation
Le cahier des charges fourni le 8 octobre 2026 fait autorité. Synchronisation volontaire Clementplane → Google, un compte par formateur, calendrier secondaire Clementplane, aucune lecture des agendas personnels. Vincent autorise conception, développement, tests et PR autonomes ; fusion, migration et déploiement de production restent soumis à son accord final.

## Audit au 8 octobre
Base main 5f4ef5066f1130ccb76565e8e42236acb3f8668a, package 1.1.0, dernière release v1.1.0. Statut Vercel de ce commit : success. Base de tests : 159/159, 33 fichiers, avec variables CI fictives. Pas de fonction Google déployée. Identifiants et détails d'infrastructure conservés dans les comptes rendus privés du titulaire. Aucun accès Google Cloud/OAuth disponible par les connecteurs examinés ; configuration et publication non attestées.

Historique confirmé en lecture seule : personal_trainer_missions=20261006102026, personal_missions_privacy_version_compatibility=20261006102038, structure_personal_mission_location=20261006102048. Les fichiers locaux portent respectivement 20261005113329, 20261005135703, 20261006050812. Ne pas modifier cet historique ni lancer db push global. tutorial_analytics est encore local uniquement.

## Architecture
- Edge Function authentifiée google-calendar : connexion OAuth offline/PKCE, paramètres, état, relance, déconnexion. Auth.getUser vérifie l'utilisateur ; aucune identité issue du corps de requête n'est utilisée pour autoriser.
- Callback HTML minimal sur le même origin : aucune analytique ni ressource externe ; efface immédiatement la query et restitue le résultat au parcours authentifié. State aléatoire, hash en base, lié à l'utilisateur et à une intention conservée dans le navigateur, à usage unique/10 minutes. Le serveur échange le code. Scopes calendar.app.created + openid + email uniquement.
- Jetons et vérificateur PKCE chiffrés AES-256-GCM, clé de secret serveur, contexte lié à l'utilisateur. Tables service_role seulement, RLS activée et grants explicites. API d'état ne renvoie aucun jeton.
- Queue durable par connexion : révision sale, lease exclusive et échéance de reprise. Triggers sur missions, dates, relations, revalidations et missions personnelles ; aucune requête Google dans la transaction métier. Réconciliation périodique indépendante du navigateur et des triggers.
- Worker authentifié par secret dédié, activé par cron séparément de la migration métier. Sources en liste blanche, construite à partir des RPC de consultation du formateur (identité contrôlée côté service), complétée de l'état d'annulation. La panne Google n'empêche aucun enregistrement métier.
- Interface provider pour Google ; projection pure testée, pas d'autre fournisseur construit.
- Identité événement = connexion + origine + mission + date. Proposition/option/affectation partagent l'identité. Date déplacée : retrait/ajout. IDs Google déterministes et marqueur privé propriétaire ; aucun événement non reconnu n'est modifié. ETag pour les écritures et reprise des erreurs. En cas de suppression Google, nouvel ID générationnel persistant.
- Import initial : jour local Europe/Paris et suivants ; événements déjà suivis réconciliés même après leur date. Aucune suppression liée au simple passage du temps.
- Champs privés, aucun invité, reminders.useDefault=false, sendUpdates=none. Export facultatif des tarifs et notes privées désactivé initialement, description entièrement reconstruite pour les retirer.

## Correspondance métier
| Source | État | Effet |
|---|---|---|
| relation OF | selectionne | aucun événement |
| relation OF | proposition_envoyee + date d'envoi + expiration future | Proposition à répondre, transparent |
| relation OF | accepte | Option en attente de confirmation, transparent |
| relation OF | affecte | Mission confirmée, opaque |
| relation OF | refuse, annule, desiste, mission_pourvue, indisponible_affecte_ailleurs ou état inconnu | suppression des éléments suivis |
| mission OF | annulee/annule/cancelled | suppression indépendamment de la relation |
| personnelle | confirmed / cancelled | Mission confirmée opaque / suppression |
| revalidation | pending pour ce formateur | anciennes dates/conditions, ancien engagement, avertissement visible |
| revalidation | accepted pour ce formateur | nouvelles conditions même si d'autres réponses restent attendues |
| revalidation | refused/unavailable | aucun engagement exporté |

Une expiration est calculée côté worker à partir de l'heure serveur. Null expiration ne vaut pas proposition valide. Le statut Google de l'événement reste confirmed : disponible/occupé est piloté par transparency.

## Limites assumées
Europe/Paris est le fuseau métier des dates existantes dépourvues de zone. Horaires locaux + zone IANA ; aucune heure inventée. Horaires incomplets → journée entière avec avertissement. Les modifications Google ne sont pas réimportées et sont remplacées par la projection Clementplane. Aucun changement des règles journalières de disponibilité de Clementplane.

Reconnexion du même compte Google : réutilisation du calendrier et des identités conservées. Un compte différent est refusé explicitement pour prévenir une copie involontaire. Si création du calendrier interrompue avec résultat incertain, ne pas créer automatiquement un second calendrier : intervention de récupération documentée.

Les paramètres de partage du calendrier sont indépendants. Les deux modes de lecture ont été vérifiés avec des comptes distincts : détails privés masqués. Certains droits avancés donnent accès aux détails privés ; Google distingue désormais une édition limitée préservant le masquage et une édition avec accès aux détails. Ces droits d’édition restent non testés dans l’environnement de recette, où ils sont indisponibles. Aucune ACL modifiée automatiquement. Voir ACCEPTANCE.md pour les observations et limites.

## Gates externes
Pas de déclaration de disponibilité publique avant projet OAuth, URL exacte, comptes de recette, publication/branding et recette réelle validés. Mode Testing : utilisateurs inscrits, refresh tokens de 7 jours pour ces scopes. Classification exacte des scopes à vérifier dans Google Auth Platform. Pas de mot de passe/secret dans le chat. API standard annoncée sans coût additionnel ; quotas et éventuelles hausses/billing à vérifier avant activation. Hébergement/cron consomment les quotas Supabase existants.

## Sources officielles consultées
- https://developers.google.com/workspace/calendar/api/auth
- https://developers.google.com/workspace/calendar/api/v3/reference/calendars/insert
- https://developers.google.com/workspace/calendar/api/v3/reference/events/list
- https://developers.google.com/workspace/calendar/api/v3/reference/events/update
- https://developers.google.com/workspace/calendar/api/concepts/sharing
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/protocols/oauth2
- https://developers.google.com/workspace/calendar/api/guides/quota
- https://supabase.com/docs/guides/functions/schedule-functions
