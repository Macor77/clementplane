# V1.2 — Configuration et exploitation

Statut : trois migrations appliquées sur environnement isolé de recette après accords ; lecture serveur et neuf contrôles SQL vérifiés avec les droits permanents. Les deux fonctions Google sont déployées sur la recette, avec refus HTTP 401 des appels non authentifiés. Les huit paramètres Edge sont enregistrés en mode testing et le scheduler à une minute répond HTTP 200 sans travail à traiter. Aucun changement de production effectué.

## Configuration exacte
Frontend (build de recette) : `VITE_GOOGLE_CALENDAR_ENABLED=true`, variables Supabase d'un environnement isolé. En production garder le flag absent/false tant que les gates ne sont pas validés.

Edge secrets, saisis dans le gestionnaire de secrets autorisé (jamais dans le chat ou Git) :

| Nom | Rôle |
|---|---|
| APP_URL | URL HTTPS canonique de l'application de l'environnement, un seul origin exact |
| GOOGLE_CLIENT_ID | client OAuth de type Application Web |
| GOOGLE_CLIENT_SECRET | secret du même client |
| GOOGLE_REDIRECT_URI | APP_URL + `/google-calendar-callback.html`, correspondance exacte Google |
| CALENDAR_ENCRYPTION_KEY | 32 octets aléatoires encodés base64/base64url ; conserver dans le gestionnaire de secrets |
| CALENDAR_WORKER_SECRET | secret aléatoire indépendant, partagé avec le seul scheduler |
| GOOGLE_CALENDAR_MODE | `disabled` (défaut), `testing` ou `public` |
| GOOGLE_CALENDAR_TEST_USER_IDS | UUID des comptes Clementplane de recette, séparés par virgules |

Supabase fournit déjà SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY aux Edge Functions. Aucun secret ne commence par VITE_. Les wrappers Google épinglent supabase-js 2.75.0. Client SDK navigateur existant inchangé.

## Projet Google
Les captures transmises par le titulaire confirment un projet Google dédié, Calendar API activée, une audience externe avec un testeur et les seuls scopes openid, email et calendar.app.created enregistrés. Le titulaire a ensuite transmis l’identifiant du client Web créé. Le secret reste hors conversation. La persistance de l’URI de retour exacte, le statut Testing et les exigences de vérification restent à contrôler. Aucun parcours OAuth réel validé. Les identifiants propres à l’environnement ne sont pas publiés ici.

1. Identifier/créer un projet dédié et activer Calendar API. Utiliser un projet/client distinct pour recette et production.
2. Application externe ; nom Clementplane ; adresse support maîtrisée ; domaine canonique vérifié ; accueil, politique de confidentialité et CGU publics cohérents. Inspecter Google Auth Platform > Branding/Audience/Data Access/Verification Center.
3. Scopes stricts : `openid`, `email`, `https://www.googleapis.com/auth/calendar.app.created`. Les méthodes calendars.insert et events.get/list/insert/update/delete acceptent ce périmètre ; calendarList.list ne l'accepte pas. On conserve l'identifiant du calendrier pour le retrouver, sans demander la liste des agendas.
4. OAuth Web, URL de retour exacte ci-dessus. Ne pas réutiliser les URL de retour Supabase Auth : cette connexion est distincte de la connexion à Clementplane.
5. En Testing, inscrire les comptes Google de test autorisés ; utiliser uniquement des données métier fictives. Le serveur restreint aussi les UUID Clementplane testeurs. Jetons d'actualisation limités à 7 jours pour cette configuration.
6. Vérifier dans la console la classification actuelle des scopes et les exigences de branding/vérification ; ne pas assimiler « In production » à « vérifié ». Le résultat exact de cette inspection est un gate, pas une hypothèse du code.
7. Ne passer en public qu'après recette réelle, politiques accessibles et statut Google permettant le public cible. Certaines organisations Google peuvent interdire l'application indépendamment de Clementplane.

## Migration et historique
Fichiers additifs : `supabase/migrations/20261008054625_google_calendar_sync.sql`, `supabase/migrations/20261008061224_google_calendar_privacy_notice.sql` (compatibilité des anciennes notices conservée) et `supabase/migrations/20261008072003_google_calendar_service_read_access.sql`. Créés avec la CLI locale. Tests PGlite et contrôles sur environnement isolé de recette réalisés : voir STAGING.md pour les versions distantes et la recette réussie avec les droits permanents. Commencer par une base de recette incluant les tables/versions existantes. La fixture SQL réduit le schéma au contrat requis et ne remplace pas une répétition de toutes les migrations.

Production : comparer nom ET contenu des trois migrations V1.1 documentées dans DESIGN.md. Elles existent déjà sous des horodatages différents. Conserver leur correspondance et appliquer uniquement les nouvelles migrations validées après accord explicite, y compris le correctif de permissions si retenu. Ne pas lancer `db push` global, ne pas réappliquer ni réparer les entrées à l'aveugle. `tutorial_analytics` n'est pas inclus.

Les deux Edge Functions sont déployées en version 1 sur la recette : google-calendar vérification JWT activée + Auth.getUser ; google-calendar-worker vérification JWT désactivée car secret dédié contrôlé dans le corps du handler avant tout accès. Le worker n'accepte que POST et son en-tête secret. Aucun endpoint ne prend l'identité à synchroniser depuis un navigateur.

En recette, les deux noms Vault sont configurés et le scheduler a été installé et vérifié. Pour un autre environnement, configurer les deux noms Vault puis appliquer `supabase/operations/google-calendar-cron.sql` uniquement dans l'environnement convenu. Le cron n'est volontairement pas installé par la migration métier. Fréquence une minute ; traitement borné, reprise et contrôle périodique de chaque connexion active (environ 5 à 7 minutes, plus délai de queue). Échecs/quota : backoff exponentiel aléatoire, Retry-After si présent. Les expirations sont évaluées côté serveur même navigateur fermé.

## Sécurité du scheduler
Contrôle pg_net : ses grants PUBLIC sont une contrainte de Supabase hébergé, non révocables par postgres. Le scheduler a été suspendu pendant l’inspection puis réactivé après vérification : rôles clients NOLOGIN, aucun rôle LOGIN personnalisé, aucun RPC public lisant les tables net détecté, et accès Data API au schéma net refusé (HTTP 406 / PGRST106). Vault est illisible par anon/authenticated. Les identifiants SQL directs restent réservés aux opérateurs de confiance.

Avant toute installation ailleurs, vérifier explicitement le refus Data API de Accept-Profile: net (PGRST106), les rôles LOGIN et les RPC pouvant lire les tables réseau. Ne pas tenter un REVOKE inefficace sur les objets appartenant à supabase_admin. Voir la [documentation Supabase](https://supabase.com/docs/guides/troubleshooting/revoking-access-to-pg_net-objects-has-no-effect-0bbc16). Le secret du worker ne donne aucun accès utilisateur à l’API Google ; il déclenche uniquement le traitement serveur borné. Ne pas exposer net et ne pas distribuer d’accès SQL direct non maîtrisé.

## Surveillance
Mesures sans données métier/secrets : nombre de connexions par statut, queue overdue, max(now-last_success_at), erreurs normalisées et durée des workers. Ne jamais journaliser requêtes OAuth, Authorization, corps Google, titres/descriptions, table de jetons ou queues pg_net. Restreindre les logs d'accès à la route OAuth et leurs durées ; vérifier la politique Vercel concernant les query strings avant activation. Ne conserver aucune capture d'un consentement contenant une vraie identité.

## Récupération
- Google indisponible/quota : reprise automatique ; bouton Relancer pour demander un nouveau cycle.
- Autorisation révoquée : reconnecter le même compte. Le statut affiche la nécessité de reconnexion ; aucun essai Google récurrent tant que l'accès n'est pas renouvelé.
- Calendrier supprimé/inaccessible : ne pas créer silencieusement un autre calendrier ; support vérifie l'accès et l'intention du formateur.
- Création du calendrier interrompue : `calendar_pending` évite une duplication. Avec l'accord du titulaire, vérifier dans Google le calendrier dont la description porte l'UUID de connexion. Si présent, renseigner son calendar_id côté serveur après contrôle propriétaire ; sinon confirmer l'absence avant de réinitialiser calendar_pending. Le nom seul ne constitue pas une preuve. Aucun accès à la liste des calendriers n'est demandé pour automatiser ce cas rare.
- Événement modifié : projection Clementplane restaurée. Événement supprimé : nouvelle génération d'identifiant. Un événement avec invités ajoutés manuellement bloque et affiche une explication ; ne pas enlever les invités ni provoquer d'e-mail automatiquement.
- Déconnexion : arrêt sous le même verrou que le worker, révocation tentée et jeton local supprimé. Si révocation non confirmée, proposer le retrait manuel sur https://myaccount.google.com/connections . Calendrier et historique préservés.
- Une clé de chiffrement perdue implique une reconnexion. Rotation : ré-encryption des seuls jetons serveur dans un environnement contrôlé, aucune exportation en clair. Conserver une sauvegarde de secret protégée.

## Coûts
L'usage standard Calendar API est annoncé sans coût additionnel ; quotas révisés en 2026 et hausses éventuelles à examiner dans le projet. Ne pas activer de facturation/hausse payante sans accord. Cron, Postgres, Edge et stockage consomment les quotas du plan Supabase ; aucune nouvelle dépense engagée. Chaque réconciliation effectue des lectures par événement suivi : mesurer et ajuster cadence/lots avant une montée en charge.

## Réversibilité
Désactiver GOOGLE_CALENDAR_MODE et le flag UI puis suspendre le cron. Ne pas supprimer tables, calendriers, jetons ou historiques en masse. Le métier Clementplane ne dépend d'aucun appel Google. Les triggers n'émettent que des mises à jour de queue transactionnelles.


## Pré requis de lecture du rôle serveur
Voir STAGING.md : l'ancien environnement isolé de recette n'avait pas les privilèges sources déjà présents en production. `20261008072003_google_calendar_service_read_access.sql` apporte uniquement SELECT sur cinq colonnes et EXECUTE sur trois RPC au rôle service_role ; aucune permission navigateur. Correctif appliqué sur la démo après accord, correspondance distante consignée dans le rapport privé ; lecture et intégration vérifiées sans grants temporaires. Ne pas confondre BYPASSRLS et privilège SELECT. Vérifier ces prérequis avant activation du worker dans tout autre environnement.
