# Recette — état à compléter uniquement sur preuves

| Critère | Automatisé local | Recette Google réelle |
|---|---|---|
| OAuth/PKCE/state/refus/reconnexion | tests unitaires de protections ; pas encore bout en bout OAuth | non réalisée |
| Proposition → option → confirmation, identité stable | testé | non réalisée |
| Missions personnelles / annulation | projection et non-régression existante | non réalisée |
| Refus / expiration / désistement / désaffectation | projection testée | non réalisée |
| Multidates / journées / DST | projection testée | non réalisée |
| Revalidation | anciennes conditions et acceptation testées | non réalisée |
| Erreurs/quota / reprise / simultanéité | provider/queue testés | non réalisée |
| Navigateur fermé | scheduler de recette actif, cycle à vide HTTP 200 vérifié ; mutation navigateur fermé non testée | non réalisée |
| Partage freeBusyReader / reader / writer / owner | règles documentées, payload privé testé | non réalisée |
| Aucun invité / notification | payload sans invités et sendUpdates=none testés | non réalisée |
| Retrait rémunération/notes | reconstruction testée | non réalisée |
| Isolation / événements externes | SQL + provider testés | non réalisée |
| Desktop / mobile / PWA | desktop 1440/mobile 390 + callback simulés PASS ; shell PWA PASS ; PWA OAuth sur appareil non vérifiée | non réalisée |

## Protocole connecté obligatoire
Utiliser une base Supabase isolée et deux comptes Clementplane fictifs, un OF fictif, un compte Google propriétaire autorisé et deux comptes Google lecteurs de test autorisés. Ne créer/modifier aucune vraie mission et n'ajouter aucun invité. Passer successivement par tous les états de la table ci-dessus. Fermer Clementplane entre deux modifications serveur et attendre le cron. Accorder manuellement, uniquement entre les comptes de test convenus, chaque niveau de consultation Google puis vérifier ce qui est affiché. Vérifier l'absence de mails/invitations avec chaque mutation. Photographier seulement des données fictives.

Consigner : date, environnement, commit exact, modes OAuth/API, scopes accordés, navigateur/PWA, résultat par ligne et éventuels écarts. Un test simulé PASS ne rend aucune case de la dernière colonne PASS.

## Préparation du parcours réel — 8 octobre 2026
Préversion Vercel configurée avec les paramètres publics de la base isolée, activation limitée à la branche de recette et redéploiement Ready (commit a8cf43b). La connexion Clementplane est accessible. La tentative via le formulaire sécurisé est refusée pour identifiants incorrects : aucune session fictive ouverte, aucun consentement Google ni calendrier créé pendant ce contrôle. Toutes les cases de recette Google réelle restent non réalisées.
