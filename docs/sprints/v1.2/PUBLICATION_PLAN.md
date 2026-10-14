# V1.2 — Dossier de publication préparé

Préparé le 12 octobre 2026. PR #5 conservée en brouillon. Ce dossier ne vaut pas autorisation de fusion, de modification de production ou de soumission Google.

## Résultats acquis

- Recette Google réelle, connexion/refus/reconnexion, synchronisation et confidentialité en lecture vérifiées : voir ACCEPTANCE.md pour leur portée.
- Invitation facultative après une première mission et calendrier séparé personnalisé.
- Fonctions de recette version 5, droits de lecture d’identité appliqués après accord et cycle Google réussi le 12 octobre à 07:05:05 (Paris).
- Renommage confirmé dans Google par la capture propriétaire à 07:09.
- CI complète run 87 verte, incluant les 11 parcours navigateur et SQL/RLS.

## Google Auth Platform : valeurs prêtes

Utiliser le projet/client destiné à la production ; conserver le projet de recette et ses accès. L’identifiant du projet de production reste à confirmer dans la console.

| Champ | Valeur préparée | Confirmation nécessaire |
| --- | --- | --- |
| Nom de l’application | Clementplane | État enregistré et statut de validation du branding |
| E-mail d’assistance | contact@clementplane.fr | Adresse proposée par les pages légales ; vérifier qu’elle est opérationnelle et sélectionnable |
| Contact développeur | Adresse maîtrisée par le titulaire | Ne pas choisir une identité sans validation |
| Accueil | Origine HTTPS canonique de production + `/` | Domaine et accès public à confirmer |
| Confidentialité | Même origine + `/confidentialite` | Page publique sans connexion, texte Google cohérent |
| CGU | Même origine + `/cgu` | Page publique sans connexion |
| Domaine autorisé | Domaine de production maîtrisé | Vérification de propriété si Google la demande |
| Audience | Externe pour les formateurs hors de l’organisation | Conserver le statut actuel jusqu’à l’accord final |
| Scopes | `openid`, `email`, `https://www.googleapis.com/auth/calendar.app.created` | Vérifier les trois scopes enregistrés, leur catégorie et les demandes du Centre de validation |
| Client OAuth | Application Web dédiée à la production | Ne pas afficher/exporter le secret |
| URI de retour | Origine HTTPS canonique + `/google-calendar-callback.html` | Correspondance exacte, distincte des retours Supabase Auth |

Justification de l’accès calendrier : Clementplane crée un calendrier secondaire dédié et y synchronise uniquement les missions accessibles au formateur. Aucun rendez-vous Google personnel n’est lu, aucun accès Gmail ni partage automatique n’est demandé. La rémunération et les notes privées sont exclues par défaut. La déconnexion supprime l’autorisation durable conservée par Clementplane ; le calendrier et son historique restent sous le contrôle du titulaire.

Le nom et le logo peuvent nécessiter une validation du branding. Le statut « en production » ne prouve pas que cette validation soit acquise. Le statut et les exigences réellement affichés dans la console feront foi. Ne pas promettre de délai de validation.

## Journaux Vercel : informations à relever

Accès actuel refusé pour l’équipe formaplane (HTTP 403). CLI opérateur absente. Le statut Ready ne permet pas de vérifier les points suivants.

| Élément | Résultat attendu à consigner |
| --- | --- |
| Plan et options d’observabilité | Valeurs réellement actives et durées de conservation |
| Personnes et rôles autorisés | Qui peut lire/exporter les journaux |
| Drains ou exports | Destinations et conservation supplémentaires, ou absence confirmée |
| Route du retour OAuth | Collecte ou absence de query strings ; contrôle sur un témoin fictif uniquement |

Le code efface la query après traitement, refuse le cache et limite le referrer. Cela n’atteste pas l’absence de collecte en amont. Ne pas rechercher ou exporter de vrais codes OAuth pour ce contrôle.

## Réserves à décider

- PWA réellement installée : le navigateur Android a été testé, mais pas ce mode. Effectuer le protocole de PUBLICATION_READINESS.md ou convenir explicitement d’une livraison avec cette limite documentée.
- Droits avancés Google : non testés car indisponibles dans la recette autorisée. Conserver l’avertissement utilisateur ; ne pas assouplir les règles Workspace pour achever un test.
- Les pages légales décrivent actuellement un accès de test. Préparer leur formulation pour l’ouverture effective, sans présenter la fonction comme publique avant sa disponibilité réelle.

## Séquence après accord final

1. Confirmer le domaine et les pages publiques, les états Google enregistrés, la politique de journaux et la décision sur les réserves.
2. Comparer les migrations déjà appliquées à la production par nom et contenu. Retenir seulement les quatre migrations calendrier nécessaires, dont celle de lecture d’identité ; ne pas lancer un `db push` global.
3. Configurer le client Google et les secrets de production via leurs gestionnaires autorisés. Maintenir `GOOGLE_CALENDAR_MODE=disabled` et le flag UI désactivé pendant l’installation.
4. Appliquer les migrations ciblées, déployer les deux fonctions et installer le scheduler après vérification de ses accès. Conserver la protection JWT du handler et le secret dédié du worker.
5. Activer d’abord un compte de recette autorisé dans l’environnement convenu ; vérifier connexion, cycle, absence de doublon, retrait/révocation et comportement de partage.
6. Ouvrir le mode public et le flag frontend seulement lorsque Google et la recette le permettent. Revoir le texte légal au moment de cette ouverture.
7. Après accord de publication, fusionner, créer le tag/release correspondant à la version retenue et consigner les résultats.

Repli : désactiver le mode Google et le flag puis suspendre le scheduler si nécessaire. Conserver calendriers, tables et historique ; aucun effacement global. Les missions Clementplane restent utilisables.

## Sources officielles revues le 12 octobre

- https://developers.google.com/workspace/guides/configure-oauth-consent
- https://developers.google.com/workspace/calendar/api/auth
- https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- https://vercel.com/docs/logs/runtime


## Installation de production autorisée — 14 octobre 2026

Cette section actualise les états historiques ci-dessus. Le titulaire a autorisé explicitement les quatre migrations et les deux fonctions, sans activation publique ni fusion.

- Projet Google confirmé : `clementplane-production`, client Web dédié Clementplane - Production. Calendar API activée ; audience externe publiée ; branding validé et visible (captures des 13–14 octobre). Trois scopes enregistrés et classés non sensibles : openid, userinfo.email, calendar.app.created. Le Centre de validation indique qu'aucune validation des accès n'est requise.
- Domaine canonique : https://app.clementplane.fr ; callback /google-calendar-callback.html. Confidentialité et CGU accessibles sans connexion, confirmé par le titulaire. Assistance et contact développeur : vincent.macor@alter-prevention.com. Aucun logo.
- Sept paramètres Edge enregistrés par le titulaire en production. Empreintes distinctes des deux clés contrôlées sur capture ; aucune valeur secrète lue/exportée. GOOGLE_CALENDAR_MODE reste disabled selon la saisie confirmée ; son contenu n'a pas été relu.
- CI Quality run 88 du commit a63a9fea457137417c5f0d3ece8ff0b942b7a426 réussie. Test SQL local calendrier relancé et réussi avant installation.
- Migrations ciblées appliquées avec succès, sans db push global : google_calendar_sync (version distante 20261014054421), google_calendar_privacy_notice (20261014054428), google_calendar_service_read_access (20261014054435), calendar_identity_read_access (20261014054441). Correspondances locales respectives : 20261008054625, 20261008061224, 20261008072003, 20261012045140. Historique antérieur préservé.
- google-calendar et google-calendar-worker déployées en version 1 ACTIVE. JWT activé pour le handler ; worker avec authentification dédiée X-Calendar-Worker-Secret avant accès DB.
- Contrôles réels après installation : trois tables avec RLS et sans SELECT anon/authenticated ; six triggers calendrier ; calendar_claim inaccessible à anon, accessible au serveur ; zéro connexion. POST sans authentification renvoie 401 sur les deux fonctions ; GET worker renvoie 405.
- Vault existe ; les noms calendar_worker_url et calendar_worker_secret sont absents. pg_cron/pg_net non installés. Aucun scheduler créé : sa préparation nécessite la saisie protégée du secret worker par le titulaire, puis les contrôles net et une autorisation d'installation.
- PR #5 reste en brouillon et non fusionnée. Aucune activation publique, modification de flag Vercel, création de connexion Google de production, ni tag/release.

Restent : Vault/scheduler, recette contrôlée de production, contrôle des journaux Vercel (accès administratif 403), décision sur PWA installée et droits d'édition non testés, texte légal d'ouverture et accord final de publication.


## Scheduler de production — 14 octobre 2026

Après instruction du titulaire de poursuivre :
- calendar_worker_secret saisi dans Vault par le titulaire ; calendar_worker_url ajouté pour l'endpoint de production. Les deux noms vérifiés sans export de valeurs.
- Extensions pg_cron/pg_net installées par migration google_calendar_scheduler_extensions. Aucun rôle client LOGIN ; Vault refusé à anon/authenticated ; aucun RPC public exécutable détecté exposant les tables réseau ou secrets.
- Contrôle Data API sur ressource avec Accept-Profile: net : 406 / PGRST106, Invalid schema: net. La route racine OpenAPI refusait les clés publiques, donc le contrôle pertinent a utilisé une ressource REST sans lecture de données.
- Tâche clementplane-google-calendar créée une fois, fréquence * * * * *, jobid 1. Première exécution planifiée succeeded à 06:09 UTC / 08:09 Paris.
- Appel protégé de contrôle, secret lu uniquement côté Postgres vers le worker : HTTP 200, paused true. Cela valide l'authentification worker/Vault et le maintien du mode disabled, pas un cycle Google de production.
- Aucune connexion de production créée, aucune activation publique ni fusion. Restent la préparation du frontend/test contrôlé et les réserves décrites plus haut, notamment les accès administratifs Vercel indisponibles.
