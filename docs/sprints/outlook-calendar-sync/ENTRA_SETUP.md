# Configuration Microsoft Entra — constat du 28 octobre 2026

Cette fiche consigne les opérations effectivement réalisées. Le sprint reste non clôturé et Microsoft n'est pas activé publiquement.

## Application créée et vérifiée

- Nom : Clementplane.
- Client ID public : `c4cbf13b-9784-4e33-9dd6-9624967de353`.
- Object ID : `d044d21a-5542-4ff8-84aa-7500e1086a72`.
- Tenant ID : `45f83475-fdfa-4ec9-87d0-0e74388b71be`.
- Comptes : `AzureADandPersonalMicrosoftAccount`.
- Une seule URI Web : `https://clementplane.fr/microsoft-calendar-callback.html`.
- Permissions configurées, toutes déléguées : `Calendars.ReadWrite email offline_access openid profile`. Le `User.Read` ajouté par défaut a été retiré de la configuration.
- Aucun consentement administrateur global accordé ; aucune permission Application.
- Flux implicites access token / ID token non cochés ; clients publics désactivés.
- Liens enregistrés : accueil `https://clementplane.fr`, CGU `https://clementplane.fr/cgu`, confidentialité `https://clementplane.fr/confidentialite`.
- Aucun secret client créé par l'agent ; aucun secret exporté dans le dépôt ou la conversation.

L'utilisateur a explicitement autorisé l'acceptation des conditions Microsoft avant l'inscription. Aucune ressource Azure payante ni montée en gamme n'a été déclenchée.

## Points restant à valider

- Secret client : création par le titulaire et dépôt direct dans le gestionnaire Supabase, jamais dans le chat.
- Domaine éditeur actuellement `vincentmacoralterprevention.onmicrosoft.com` ; éditeur non vérifié. Le portail affiche un avertissement sur le consentement des applications multilocataires non vérifiées. Vérifier les exigences Microsoft et la politique du tenant de recette ; ne pas contourner ces restrictions.
- Comptes de recette personnel et professionnel avec boîte Exchange ; consentement et cycle Graph réels toujours non effectués.
- Environnement de recette, migrations, fonctions et cron Microsoft : pas de nouveau déploiement réalisé lors de la configuration Entra.
- L'accès au portail Azure ne constitue pas une preuve de licence Exchange Online.

## Vercel

L'accès détaillé de l'équipe fonctionne désormais via le connecteur. Déploiement de prévisualisation `dpl_HtzryjA4VM83ZmLBomN4NKsNWRRg`, commit `aed32363e44a5314821c2f915e5e4d5d4b54377a`, état `READY`, cible non-production.
Cela ne prouve ni l'activation du flag Microsoft ni la recette OAuth.

Les résultats de tests restent ceux de [DELIVERY.md](DELIVERY.md) ; aucune nouvelle recette réelle n'est revendiquée.
