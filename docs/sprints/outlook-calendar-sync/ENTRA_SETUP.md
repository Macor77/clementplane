> **État actualisé :** Entra configuré et backend déployé en recette isolée. Connexion personnelle, créations/modifications/retraits et reconnexion réels réussis. Voir [REAL_ACCEPTANCE.md](REAL_ACCEPTANCE.md). Les anciennes étapes ci-dessous restent historiques. Recette professionnelle et clôture non terminées ; aucune activation publique.

# Configuration Microsoft Entra — constat du 28 octobre 2026

Cette fiche consigne les opérations effectivement réalisées. Le sprint reste non clôturé et Microsoft n'est pas activé publiquement.

## Application créée et vérifiée

- Nom : Clementplane.
- Client ID public : `c4cbf13b-9784-4e33-9dd6-9624967de353`.
- Object ID : `d044d21a-5542-4ff8-84aa-7500e1086a72`.
- Tenant ID : `45f83475-fdfa-4ec9-87d0-0e74388b71be`.
- Comptes : `AzureADandPersonalMicrosoftAccount`.
- Deux URI Web vérifiées : `https://clementplane.fr/microsoft-calendar-callback.html` et `https://clementplane-git-feature-outlook-calendar-sync-formaplane.vercel.app/microsoft-calendar-callback.html`. La seconde a été enregistrée après accord explicite du titulaire.
- Permissions configurées, toutes déléguées : `Calendars.ReadWrite email offline_access openid profile`. Le `User.Read` ajouté par défaut a été retiré de la configuration.
- Aucun consentement administrateur global accordé ; aucune permission Application.
- Flux implicites access token / ID token non cochés ; clients publics désactivés.
- Liens enregistrés : accueil `https://clementplane.fr`, CGU `https://clementplane.fr/cgu`, confidentialité `https://clementplane.fr/confidentialite`.
- Aucun secret client créé par l'agent ; aucun secret exporté dans le dépôt ou la conversation.

L'utilisateur a explicitement autorisé l'acceptation des conditions Microsoft avant l'inscription. Aucune ressource Azure payante ni montée en gamme n'a été déclenchée.

## Points restant à valider

- Secret client : créé par le titulaire ; présence du nom `MICROSOFT_CLIENT_SECRET` vérifiée dans les secrets Edge de production. Valeur non consultée. Présence également vérifiée dans la branche de recette après dépôt direct par le titulaire ; valeur jamais lue ni exportée.
- Domaine éditeur actuellement `vincentmacoralterprevention.onmicrosoft.com` ; éditeur non vérifié. Le portail affiche un avertissement sur le consentement des applications multilocataires non vérifiées. Vérifier les exigences Microsoft et la politique du tenant de recette ; ne pas contourner ces restrictions.
- Comptes de recette personnel et professionnel avec boîte Exchange ; consentement et cycle Graph réels toujours non effectués.
- Environnement de recette existant repris : migrations et fonctions Microsoft déployées (voir ci-dessous). Cron Microsoft non installé ; aucun cycle Graph réel exécuté.
- L'accès au portail Azure ne constitue pas une preuve de licence Exchange Online.

## Vercel

L'accès détaillé de l'équipe fonctionne désormais via le connecteur. Déploiement de prévisualisation `dpl_HtzryjA4VM83ZmLBomN4NKsNWRRg`, commit `aed32363e44a5314821c2f915e5e4d5d4b54377a`, état `READY`, cible non-production.
Cela ne prouve ni l'activation du flag Microsoft ni la recette OAuth.

Les résultats de tests restent ceux de [DELIVERY.md](DELIVERY.md) ; aucune nouvelle recette réelle n'est revendiquée.

## Préparation de recette isolée — 28 octobre 2026

- Branche Supabase existante `documentation-demo`, projet `jqhbrkyeawtsuzrzrnvm` ; aucune création de projet ni modification des fonctions Google.
- Migrations appliquées : `20261028085029_microsoft_calendar_sync`, `20261028085042_microsoft_calendar_privacy_notice` (versions distantes attribuées par le connecteur ; ne pas rejouer les fichiers locaux sous leurs timestamps différents).
- Contrôle SQL : RLS activée sur les trois tables Microsoft ; aucune lecture anon/authenticated ; RPC claim/finish/lock réservées au service_role ; six triggers Microsoft ; zéro connexion Microsoft.
- Fonctions Microsoft v1 actives : `microsoft-calendar` avec vérification JWT, worker avec authentification serveur dédiée. Appels POST anonymes réels : HTTP 401 pour chacune. Le mode absent reste désactivé ; aucun cron Microsoft installé.
- Paramètres Edge de recette enregistrés : `MICROSOFT_CLIENT_ID`, `MICROSOFT_APP_URL`, `MICROSOFT_REDIRECT_URI` et `MICROSOFT_CALENDAR_MODE=disabled`. Clé de chiffrement Google existante conservée.
- Ajout de `MICROSOFT_APP_URL`, facultatif, dans les deux points d'entrée pour isoler l'origine Microsoft sans changer l'origine Google.
- Vercel : variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_MICROSOFT_CALENDAR_ENABLED=true` limitées à la preview de `feature/outlook-calendar-sync`. URL et clé publique pointent vers la branche Supabase de recette. Aucun changement des variables production.
- Alias existant de la branche : `https://clementplane-git-feature-outlook-calendar-sync-formaplane.vercel.app`. L'URI de callback correspondante est maintenant enregistrée dans Entra et vérifiée dans la liste des URI Web.
- Vérification locale après changement d'origine : 12 fichiers / 82 tests calendrier et contrats réussis ; ESLint 0 erreur, 2 avertissements préexistants ; build production réussi (avertissement de taille du bundle préexistant).

Ces contrôles ne constituent pas la recette Microsoft personnelle/professionnelle. Le secret de recette et les paramètres OAuth sont déposés. L'allowlist, le secret dédié du worker, le cron et les parcours réels restent à finaliser avant toute activation publique.

## Dernier point de reprise

- CI Quality run 138 entièrement réussie sur le code `3f978fbec5fc8ec0c27a048b828205265e92117b` : https://github.com/Macor77/clementplane/actions/runs/40661615660.
- Prévisualisation Vercel `dpl_4xHkSKtzAQzdChdRjWvBb3sFm7Jy` READY pour ce même code ; accès navigateur vérifié après connexion Vercel normale via GitHub. Protection conservée ; aucun lien de partage créé.
- Écran de connexion Clementplane de recette atteint. Connexion au compte formateur non effectuée : demande sécurisée déclinée. Aucun essai OAuth Microsoft réel, aucun calendrier créé, aucune mission modifiée.
- Mode serveur Microsoft toujours `disabled`. Prochaine étape : utiliser le compte formateur fictif autorisé, limiter l'allowlist à son UUID, préparer le worker/cron, puis obtenir le consentement Microsoft et dérouler la recette.

## Recette personnelle démarrée — 28 octobre 2026

- Nouveau compte fictif « Vincent Recette Outlook » créé et confirmé dans documentation-demo ; adresse de recette dédiée, données privées non publiées dans ce document. Profil fictif situé à Paris.
- Mode Microsoft `testing`, allowlist limitée à ce nouveau compte ; aucune ouverture publique.
- Consentement Outlook personnel accordé explicitement par le titulaire. Première tentative rejetée après expiration des dix minutes ; nouvelle demande réussie sans assouplir la durée ni la validation du state.
- Connexion réelle `active`, calendrier dédié créé, marqueur de création incertaine désactivé, présence du jeton chiffré vérifiée sans lecture de sa valeur. Notes et rémunération désactivées.
- Authentification du worker via Vault ajoutée : la clé dédiée est générée côté base et vérifiée par une RPC réservée au service_role renvoyant uniquement un booléen. Clé jamais affichée. Ancienne configuration explicite Edge toujours supportée.
- Worker de recette déployé en version 9. Cron Microsoft installé (une minute), aucune modification du cron Google. Net refusé dans la Data API (HTTP 406 / PGRST106) ; rôles navigateur et service_role NOLOGIN ; pas de RPC publique exportant les files réseau.
- Premier cycle automatique réel réussi à 10:37:03 UTC (11:37:03 Paris), sans mission. Une fixture personnelle à deux dates a ensuite été insérée dans la seule base de recette. La saisie des champs date via le navigateur de contrôle a échoué ; ce parcours UI n'est pas déclaré validé.
- Vérification locale du changement Vault : 56 fichiers / 318 tests Vitest réussis, test SQL Microsoft et droits Vault réussi, ESLint 0 erreur / 2 avertissements préexistants, build réussi. La CI du changement Vault reste à vérifier après push.

Restent notamment les cycles création/modification/retrait avec événements, la reconnexion sans doublon, la recette professionnelle et la revue finale avant publication.
