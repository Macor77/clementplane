# V1.2 — Conditions restantes de publication

Revue du 9 octobre 2026. Le parcours desktop connexion → refus → reconnexion est vérifié sur données métier fictives. Préversion uniquement ; aucun accord de production déduit de ces contrôles.

## Résultats et preuves

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| Refus OAuth avant expiration | Message explicite ; connexion toujours déconnectée et jeton serveur absent | Interface réelle puis lecture serveur |
| Reconnexion après refus | Cycle achevé sans erreur, même calendrier et trois identifiants d’événements | Fenêtre de recette contrôlée ; pas de doublon |
| Accès Google demandé | openid, email et calendar.app.created ; autorisation portant sur les agendas secondaires créés par l’application | Code et écran d’autorisation réels ; classification administrative non attestée |
| Configuration initiale | Captures du titulaire : projet de recette, Calendar API activée, audience externe avec compte test, sélection des trois scopes | Preuves historiques ; la sélection des scopes ne prouve pas leur enregistrement ni leur classification actuelle |
| Présentation Google | L’écran réel affiche le domaine de préversion et aucun lien propre à l’application vers les politiques | Branding à préparer et vérifier avant publication générale |
| Confidentialité applicative | Notice et code cohérents : export volontaire, options séparées, jeton supprimé à la déconnexion, calendrier et historique conservés | Revue technique documentaire, sans certification contractuelle ou juridique |
| Journaux du callback | Page dédiée, aucune analytique ni ressource tierce dans son code ; effacement immédiat de la query ; no-store et no-referrer configurés | N’atteste pas les journaux de l’hébergeur, leurs accès ou leur durée |

## Configuration Google à confirmer

La console est inaccessible depuis le navigateur de contrôle. Conserver le projet de recette ; ne pas le transformer en production pour achever les essais.

Pour la publication, vérifier dans Google Auth Platform : Branding (identité Clementplane, support, domaine maîtrisé et pages publiques), Audience (cible et statut), Accès aux données (trois scopes exacts et catégories) et Centre de validation. Une capture de la sélection des scopes ne remplace pas ces états enregistrés. L’ouverture publique des pages de confidentialité et CGU actuelles n’a pas pu être vérifiée par l’outil de consultation.

Google distingue validation du branding et accès aux données. Le nom/logo public peut nécessiter une validation de marque ; des scopes sensibles ou restreints peuvent ajouter d’autres exigences. Le statut réellement affiché dans la console fait foi. Ne pas publier ni soumettre un élargissement d’accès sans l’accord final prévu au mandat.

Sources officielles consultées le 9 octobre : [configuration OAuth](https://developers.google.com/workspace/guides/configure-oauth-consent), [validation du branding](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification).

## Journaux et exploitation

L’accès Vercel disponible ne liste aucune équipe ; l’inspection administrative du projet reste indisponible. Aucun secret ni journal OAuth brut n’a été extrait.

À confirmer avec un accès autorisé : plan, Observability Plus éventuel, drains/exports de logs, personnes autorisées et présence éventuelle des paramètres de requête. Utiliser seulement une requête témoin entièrement fictive pour contrôler la collecte ; ne pas exporter de vrais codes OAuth. Effacer une query dans le navigateur n’efface pas une éventuelle journalisation en amont.

La [documentation Vercel](https://vercel.com/docs/logs/runtime) annonce une rétention variable selon le plan et les options ; les drains peuvent conserver une autre copie. Ces durées génériques ne prouvent pas la configuration Clementplane. Consigner la configuration et les durées réelles avant de lever ce point.

## Essai sur téléphone réel

Utiliser uniquement la préversion et le compte Clementplane fictif autorisé. Ne pas modifier de mission réelle.

1. Ouvrir les paramètres dans le navigateur du téléphone et vérifier que la carte Google est lisible, sans défilement horizontal.
2. Si l’installation est proposée, installer la PWA ou l’ajouter à l’écran d’accueil puis l’ouvrir. Noter téléphone, système, navigateur et mode utilisé.
3. Dans cette même session, déconnecter puis reconnecter le propriétaire Google déjà autorisé. Choisir le même compte et terminer en moins de dix minutes. Observer le retour effectif dans les paramètres et la dernière synchronisation réussie.
4. Vérifier dans Google le calendrier dédié et les trois événements de recette, sans doublon. Fermer puis rouvrir la PWA ; contrôler que l’état connecté est conservé.
5. Fournir le résultat et une capture de la carte, sans mot de passe ni écran de consentement. Le contrôle serveur des identifiants et du cycle sera fait ensuite par l’agent.

Le mobile simulé et le service worker testés en CI ne remplacent pas cet essai. Si Google ouvre un autre navigateur, ne pas le déclarer réussi : recommencer dans le même navigateur et relever précisément ce comportement.

## Décision avant production

Restent le téléphone réel, les états Google enregistrés, les réglages de journaux et la validation du cadre de protection des données. Le droit d’édition Google est une réserve distincte : indisponible dans l’environnement autorisé, sans modification des règles d’organisation. Le titulaire doit accepter explicitement cette réserve ou autoriser un environnement adapté avant clôture. La fusion, les migrations ciblées, le déploiement, le tag et la release restent soumis à son accord final.
