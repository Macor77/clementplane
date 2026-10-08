# V1.2 — vérification SQL sur documentation-demo

État au 8 octobre 2026 : deux migrations appliquées après autorisation explicite. Production inchangée. Recette Google réelle non réalisée.

## Environnement
Projet isolé `jqhbrkyeawtsuzrzrnvm`, branche Supabase `documentation-demo`, organisation Alter Prévention. Trois comptes fictifs (.test/.invalid), deux formateurs, deux missions OF et deux missions personnelles. Aucun nouveau compte, aucune donnée ou mission réelle utilisés.

La branche conserve son statut historique `MIGRATIONS_FAILED` ; la base répond et ses migrations de missions personnelles sont présentes. Aucun reset ou rejeu global effectué.

## Correspondance des migrations
| Fichier local | Version enregistrée sur la recette | État |
| --- | --- | --- |
| 20261008054625_google_calendar_sync.sql | 20261008071104 / google_calendar_sync | appliquée |
| 20261008061224_google_calendar_privacy_notice.sql | 20261008071114 / google_calendar_privacy_notice | appliquée |
| 20261008072003_google_calendar_service_read_access.sql | aucune | préparée, application refusée avant exécution par auto-review |

Empreintes SHA-256 des deux migrations appliquées : `927dc480dd0e2c427cafc25b7cc8cf4aaeeea469cce416de70a3674a22981a11` et `332d0d1c18e892262791ce3f5dde84ad3c2a803d0d9de34e079ed52c5afdc629`. Les différences d'horodatages proviennent de l'application par le connecteur ; conserver les correspondances, ne pas rejouer ni renommer l'historique.

## Résultats
- Trois tables calendrier avec RLS ; accès direct anon/authenticated refusé, accès serveur autorisé. RPC calendrier et schéma privé inaccessibles aux utilisateurs.
- Neuf contrôles réels réussis : refus des rôles publics, lecture des RPC existantes pour les deux formateurs, isolation des sources, restauration du contexte JWT, exclusion worker/commande, rejet d'un verrou étranger, déclencheur depuis une écriture authentifiée, conservation d'une modification concurrente, RLS/schéma privé.
- Notice : les versions 2026-08-29, 2026-10-05 et 2026-10-08 sont acceptées et enregistrées ; consentement CGU manquant et version de confidentialité inconnue refusés. Test par déclencheur sur table temporaire, sans création d'utilisateur Auth.
- Après rollback : 0 connexion, 0 état OAuth, 0 événement ; 3 comptes, 2 missions personnelles et 6 acceptations légales inchangés. Aucune donnée de test conservée. Aucune clé ou autorisation Google utilisée.
- Contrôle sécurité avant/après : aucun nouveau WARN. Trois INFO « RLS enabled, no policy » attendus pour les tables serveur seulement ; les accès utilisateurs sont volontairement révoqués. [Explication du diagnostic](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Écart de permissions et condition des tests
La première exécution en rôle `service_role` a échoué : l'ancien schéma de démonstration ne lui donne pas SELECT sur trainers/missions ni EXECUTE sur les trois RPC formateur. La production possède déjà ces droits, constatés en lecture seule. Le snapshot s'exécute correctement sur les deux formateurs avec le rôle propriétaire.

Les neuf contrôles serveur ont donc utilisé des droits minimaux **temporaires**, annulés avec toute la transaction. Script reproductible : `supabase/operations/google-calendar-demo-acceptance.sql`, réservé à la démonstration, avec vérification des domaines fictifs et rollback final. Cette preuve ne signifie pas que le worker peut déjà fonctionner sans préparation supplémentaire.

Le correctif complémentaire préparé est limité à :
- SELECT sur trainers(id, user_id) ;
- SELECT sur missions(id, statut, adresse) ;
- EXECUTE sur get_my_mission_proposals(), get_my_pending_mission_change(uuid), get_my_mission_organization_contact(uuid), pour le seul rôle serveur.

Aucune nouvelle permission anon/authenticated, aucune écriture métier autorisée, aucun nouveau secret. Le snapshot reste SECURITY INVOKER. Le test SQL local reproduit désormais les droits absents : RED (42501), puis GREEN avec le correctif ; il vérifie aussi l'absence de droit UPDATE et le caractère limité aux colonnes.

Le contrôle automatique a refusé **l'application persistante de ce troisième correctif**, au motif qu'il ajoute des droits distincts des deux migrations expressément autorisées. Aucun contournement ; autorisation ciblée encore nécessaire. L'essai transactionnel avec ces mêmes droits minimaux a réussi puis été entièrement annulé ; absence de droits persistants confirmée ensuite.

## Suite
Approuver et appliquer uniquement le correctif complémentaire sur documentation-demo, puis refaire la lecture serveur sans droits temporaires. Ensuite : configuration OAuth, fonctions/cron et recette Google autorisée. Google Cloud restait inaccessible dans le navigateur de cette session. Aucun déploiement Edge ou scheduler effectué, aucune disponibilité publique à annoncer.
