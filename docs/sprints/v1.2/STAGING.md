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
Les fonctions `google-calendar` et `google-calendar-worker` sont déployées en version 1, statut ACTIVE, uniquement sur la recette. La première conserve la vérification JWT ; le worker contrôle son secret dédié dans le handler. Les deux appels POST sans authentification retournent HTTP 401. Ces contrôles ne valident pas encore un parcours OAuth authentifié ou Google.

Les captures transmises par le titulaire confirment un projet Google dédié, Calendar API activée, une audience externe avec un testeur et les seuls scopes openid, email et calendar.app.created enregistrés. Le titulaire a ensuite transmis l’identifiant du client Web créé. Le secret reste hors conversation. La persistance de l’URI de retour exacte, le statut Testing et les exigences de vérification restent à contrôler.

## Configuration et scheduler
Les huit paramètres Edge sont maintenant enregistrés sur la recette. L’identifiant client a été contrôlé par empreinte ; la valeur du secret Google n’a pas été lue. Le mode testing est limité aux deux comptes Clementplane fictifs. Les clés indépendantes de chiffrement et du worker ont été générées avec 32 octets aléatoires, conservées dans Vault et copiées dans les secrets Edge ; leurs empreintes concordent.

Le scheduler est actif à une minute. Un déclenchement planifié et les réponses HTTP 200 du worker avec processed: 0 sont vérifiés ; zéro connexion et zéro événement Google. Cela valide le circuit scheduler → worker → base, pas OAuth ni la synchronisation réelle.

Contrôle pg_net : ses grants PUBLIC sont une contrainte de Supabase hébergé, non révocables par postgres. Le scheduler a été suspendu pendant l’inspection puis réactivé après vérification : rôles clients NOLOGIN, aucun rôle LOGIN personnalisé, aucun RPC public lisant les tables net détecté, et accès Data API au schéma net refusé (HTTP 406 / PGRST106). Vault est illisible par anon/authenticated. Les identifiants SQL directs restent réservés aux opérateurs de confiance.

Le script opérationnel ajoute désormais un garde-fou NOLOGIN et documente le contrôle Data API préalable. Le déploiement du scheduler a une entrée distante distincte des trois migrations métier ; sa correspondance doit être contrôlée avant toute opération globale.

## Préversion Vercel
Après accord explicite, trois variables Config ont été ajoutées uniquement à la branche feature/v1.2-google-calendar en Preview : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (clé publique anon de recette) et VITE_GOOGLE_CALENDAR_ENABLED=true. Les variables globales et celles des autres branches n’ont pas été modifiées.

Redéploiement sans cache du commit a8cf43b8714619036242f978a9a78a167aae8be9 : Ready le 8 octobre 2026 à 11:02 UTC, durée 23 secondes. Le domaine stable de la branche affiche l’application. Le plugin Vercel est installé mais refuse le périmètre équipe (403) ; la configuration a été effectuée via la session web autorisée. Preuves visuelles conservées dans le dossier privé du titulaire.

## Suite
La préversion Vercel est configurée pour la base isolée et redéployée. La page de connexion s’affiche ; le callback sans intention OAuth revient à la connexion. La tentative avec le formulaire sécurisé a été refusée (« Adresse e-mail ou mot de passe incorrect »). Rétablir l’accès à un compte fictif autorisé, puis réaliser le parcours OAuth et la recette Google. Google Cloud reste inaccessible dans le navigateur de cette session ; le titulaire effectue sa configuration depuis son propre navigateur. Aucune disponibilité publique à annoncer. PR et release restent en brouillon.
