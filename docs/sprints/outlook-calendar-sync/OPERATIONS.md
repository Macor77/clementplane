# Outlook / Microsoft 365 — exploitation et mise en service

État au 28 octobre 2026 : code préparé sur PR #19, **aucune activation publique autorisée sans recette réelle**. Les étapes ci-dessous ne sont pas des opérations déjà exécutées.

## Configuration Microsoft Entra (intervention du titulaire)

1. Créer ou reprendre l'application Clementplane dans Microsoft Entra. Comptes pris en charge : comptes de tous les annuaires d'organisation ET comptes Microsoft personnels (`AzureADandPersonalMicrosoftAccount`). Conserver le même client ID lors des renouvellements de secret : le `sub` OIDC est propre à l'application.
2. Plateforme **Web**, flux Authorization Code côté serveur avec PKCE S256 ; ne pas configurer cette intégration comme SPA ni activer implicit grant.
3. URI exacte de production : `https://clementplane.fr/microsoft-calendar-callback.html`. Pour une recette avant fusion, enregistrer une URI du même chemin sur un domaine de preview stable ; `APP_URL` doit correspondre exactement à cette origine. Pas de wildcard ni URI transmise par le navigateur.
4. Permissions déléguées : `openid profile email offline_access Calendars.ReadWrite`. Aucune permission Application, `User.Read` ou `Calendars.ReadWrite.Shared` nécessaire. Les politiques du tenant peuvent imposer un consentement administrateur ou interdire l'application. Ne pas contourner ces politiques.
5. Renseigner nom, domaine éditeur, contact et liens CGU/confidentialité Clementplane ; réaliser les vérifications Microsoft exigées dans le tenant.
6. Créer le secret client dans Entra et le saisir directement dans le gestionnaire de secrets Supabase. Ne jamais le coller dans GitHub, un journal, une commande enregistrée ou la conversation. Suivre son expiration et renouveler avant échéance.
7. Prévoir un compte Outlook personnel et un compte professionnel Microsoft 365 disposant d'une boîte Exchange Online, avec données fictives uniquement. Aucun mot de passe demandé par l'agent.

## Secrets et drapeaux

| Emplacement | Nom | Valeur attendue / action |
|---|---|---|
| Supabase Edge | `APP_URL` | Origine exacte du frontend de recette ou production ; secret commun existant, ne pas le changer sur la production Google pour tester une preview |
| Supabase Edge | `MICROSOFT_CLIENT_ID` | Identifiant public de l'application Entra |
| Supabase Edge | `MICROSOFT_CLIENT_SECRET` | Secret Entra, gestionnaire sécurisé uniquement |
| Supabase Edge | `MICROSOFT_REDIRECT_URI` | `APP_URL` + `/microsoft-calendar-callback.html` |
| Supabase Edge | `CALENDAR_ENCRYPTION_KEY` | Clé AES-GCM 256 bits déjà utilisée par l'infrastructure calendrier ; ne pas remplacer la clé Google existante |
| Supabase Edge | `MICROSOFT_CALENDAR_MODE` | `disabled`, puis `testing`, puis `public` seulement après recette |
| Supabase Edge | `MICROSOFT_CALENDAR_TEST_USER_IDS` | UUID Clementplane des comptes de test, séparés par virgules ; contrôle du handler ET du claim worker |
| Supabase Edge | `MICROSOFT_CALENDAR_WORKER_SECRET` | Secret indépendant du worker Google |
| Supabase Vault | `microsoft_calendar_worker_url` | URL complète de `microsoft-calendar-worker` |
| Supabase Vault | `microsoft_calendar_worker_secret` | Même secret que `MICROSOFT_CALENDAR_WORKER_SECRET` |
| Vercel frontend | `VITE_MICROSOFT_CALENDAR_ENABLED` | absent/false par défaut ; true uniquement dans l'environnement de recette autorisé puis en public après validation |

Le frontend n'embarque aucun secret Microsoft. Le mode serveur est le verrou d'accès réel. Garder le flag frontend vrai lors d'une pause serveur permet aux utilisateurs déjà connectés de se déconnecter.

## Ordre de livraison

- Vérifier projet, sauvegarde, diff et CI du commit exact. Projet production identifié : `hctvkynrgmnxjynbncdi`. Vercel : projet `prj_gNJbyUiPEIkj5ZPdJozxKbrmD3QE`, équipe `team_PbxydmCzCPS1tJewtRgkab7Y` (`formaplane`). L'accès détaillé Vercel exige actuellement l'autorisation de cette équipe.
- Utiliser d'abord un environnement isolé existant. Aucun projet payant créé. Ne pas réutiliser la production avec une autre `APP_URL` : cela casserait le CORS Google existant. Si aucun environnement isolé n'est disponible, convenir d'une recette à accès restreint sur l'origine de production, sans ouvrir Microsoft au public.
- Appliquer **uniquement** `20261028065329_microsoft_calendar_sync.sql` et `20261028071102_microsoft_calendar_privacy_notice.sql`, après vérification de leur absence. Ne pas lancer `db push` global : les migrations Google locales du 08/12 octobre sont déjà présentes en production sous des versions du 14 octobre (voir sprint V1.2).
- Déployer `microsoft-calendar` (`verify_jwt=true`, validation `auth.getUser`) et `microsoft-calendar-worker` (`verify_jwt=false`, secret serveur dédié). Ne pas redéployer Google.
- Vérifier les tables/RPC en tant que `anon`, `authenticated` et `service_role` ; RLS activée, aucune lecture navigateur des trois tables, snapshot métier partagé sans droits supplémentaires. Vérifier les nouveaux triggers et l'absence de doublon du cron.
- Configurer les secrets, le mode testing et l'allowlist. Configurer le cron via `supabase/operations/microsoft-calendar-cron.sql` seulement après les préconditions de ce script, notamment l'absence d'exposition `net` dans la Data API. Ne jamais afficher les valeurs Vault ni les commandes contenant les valeurs.
- Déployer le frontend de recette. La notice Microsoft et sa version `2026-10-28` suivent le flag frontend ; la migration de compatibilité des inscriptions doit donc précéder ce frontend. Sans flag, la version de notice Google reste `2026-10-08`.
- Exécuter [ACCEPTANCE.md](ACCEPTANCE.md) ; conserver compte de test anonymisé, commit, environnement, horodatage, identifiants techniques non sensibles et résultat observé. La CI simulée ne remplace pas cette étape.
- Après validation complète : version cible `1.3.0` (nouveau fournisseur), synchroniser package/lock/affichage, notes et dates réelles, fusionner, vérifier Vercel et Supabase, passer en public, vérifier un parcours sans effet destructif. Tag/release/ZIP sur le commit exact selon la procédure habituelle. Aucun mail d'annonce sans mandat distinct.

## Reprise et incidents

Le cron tourne chaque minute, jusqu'à cinq connexions par appel et budget de 45 secondes. Les connexions réussies sont revues environ toutes les 5–7 minutes ; les triggers avancent leur échéance lors des changements métier. La projection complète conserve aussi les retraits des propositions expirées, sans navigateur ouvert. Un gros compte reprend son cycle après budget atteint.

- `authorization_revoked` : reconnecter le même compte, réexaminer consentement/politiques du tenant. L'adresse e-mail peut manquer dans UserInfo ; elle n'est pas l'identifiant de sécurité.
- 429/5xx : reprise avec backoff et `Retry-After`, pas de boucle agressive. Une réponse négative complète n'est pas équivalente à un POST dont la réponse a été perdue.
- `calendar_creation_uncertain` : rechercher uniquement le calendrier portant le marqueur `clementplaneOwner` de la connexion. La reconnexion récupère celui-ci s'il devient visible. Sans preuve d'absence, ne pas remettre `calendar_pending=false` ni recréer un calendrier.
- `event_creation_uncertain` : relancer pour retrouver l'événement portant la clé dans le calendrier dédié. `transactionId` est stable par génération ; après une réponse ambiguë, aucun nouveau POST tant que l'existence n'est pas résolue. Une annulation ne doit pas faire oublier un événement possiblement créé.
- `foreign_event`, `managed_event_has_guests`, `duplicate_managed_event` : arrêt des mutations. Ne pas effacer les marqueurs ni supprimer automatiquement des copies étrangères ; faire retirer les invités par le titulaire avant reprise.
- Calendrier supprimé dans Outlook : ne pas créer silencieusement un remplaçant. Support avec le titulaire, puis récupération contrôlée des correspondances si nécessaire.
- Déconnexion : attend le verrou courant, supprime états OAuth et jeton local ; conserve identifiants et événements distants. Microsoft n'a pas de révocation par application équivalente à l'endpoint Google utilisé ici : proposer au titulaire de retirer Clementplane dans ses autorisations Microsoft. Suppression du compte Clementplane : cascade des données locales, pas d'effacement distant automatique.

Surveillance : compter les états/errors/retards, sans corps d'événement, codes OAuth ni tokens. Contrôler expiration du secret Entra, erreurs 403 de consentement/politique, cycles incomplets et latence. Ne pas exporter les files `pg_net` : elles contiennent temporairement l'en-tête d'authentification du worker.

## Retour arrière

Passer `MICROSOFT_CALENDAR_MODE=disabled`, suspendre uniquement `clementplane-microsoft-calendar`, conserver la déconnexion accessible, vérifier que Google continue. Un rollback frontend ne retire ni migrations ni événements déjà copiés. Conserver les correspondances pour une reprise sûre ; ne jamais supprimer les tables comme simple rollback. Révocation des autorisations Microsoft par le titulaire si nécessaire.

## Sources techniques consultées le 28 octobre 2026

- [Microsoft UserInfo](https://learn.microsoft.com/en-us/entra/identity-platform/userinfo) : identité serveur et e-mail facultatif.
- [Permissions Graph](https://learn.microsoft.com/en-us/graph/permissions-reference#calendarsreadwrite) : accès délégué aux calendriers, comptes personnels/professionnels.
- [Événement Graph](https://learn.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0) : transactionId, privé, libre/occupé.
- [Propriétés étendues](https://learn.microsoft.com/en-us/graph/api/singlevaluelegacyextendedproperty-get?view=graph-rest-1.0) : filtres explicites de lecture et recherche des calendriers/événements.
- [Authentification Edge Supabase](https://supabase.com/docs/guides/functions/auth-legacy-jwt) : validation serveur, rôle privilégié séparé.
