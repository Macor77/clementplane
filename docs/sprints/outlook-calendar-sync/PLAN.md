# Sprint — Synchronisation Outlook / Microsoft 365 (en cours)

## État initial au 27 octobre 2026
Branche isolée `feature/outlook-calendar-sync`. Aucun changement en production. Base vérifiée : V1.2 Google Agenda livrée, dossier `docs/sprints/v1.2/CLOSURE.md`, PR #5 et #8. Version actuelle du package : 1.2.4 ; version du prochain lot à fixer lors de la clôture.

## Objectif
Permettre à un formateur de connecter volontairement son calendrier Microsoft (Outlook.com ou Microsoft 365) et de retrouver les propositions, options et missions personnelles/OF dans un calendrier distinct « Prénom Nom — Clementplane », avec modifications et retraits. Ne pas modifier le moteur métier ni le fonctionnement Google existant.

## Architecture cible (à confronter au code existant)
- Connexion Microsoft par OAuth 2.0 Authorization Code + PKCE / flux serveur sécurisé, avec validation stricte de state, redirection autorisée et identité de l'utilisateur Clementplane.
- API Microsoft Graph, permissions déléguées minimales (notamment Calendars.ReadWrite et offline_access selon le flux) ; vérifier la prise en charge comptes personnels et professionnels et les politiques de consentement des tenants.
- Stockage des jetons exclusivement côté serveur, chiffrés, jamais dans le navigateur ni dans les journaux ; rotation et révocation prises en charge.
- Calendrier Microsoft dédié ; conserver identifiants du calendrier et des événements par utilisateur, fournisseur et mission/date pour éviter les doublons.
- Synchronisation sortante unidirectionnelle : créations, changements d'état/dates/heures, annulations et désaffectations ; reprise idempotente, retry avec backoff et gestion des limites Graph.
- Coexistence Google + Microsoft si les deux comptes sont connectés, sans écraser ni dupliquer les événements d'un même fournisseur.
- Respecter la confidentialité actuelle des options et des missions dans les titres, descriptions et paramètres de visibilité ; aucun accès aux rendez-vous personnels pour le matching.
- Déconnexion explicite : cesser les mises à jour et expliquer le devenir des copies déjà créées ; ne pas supprimer silencieusement le calendrier du formateur.

## Plan d'exécution
1. Inspecter les sources Google V1.2 (Edge Functions, migrations, services, composants, tests) et documenter les points d'extension.
2. Vérifier la documentation Microsoft Graph / Entra et Supabase actuelle ; préparer l'enregistrement de l'application Microsoft, redirect URI, secrets serveur et permissions.
3. Implémenter le fournisseur Microsoft, les correspondances d'événements et les migrations avec RLS et contrôle des privilèges.
4. Ajouter connexion, état, erreur et déconnexion Outlook dans les paramètres formateur.
5. Tester création, option, affectation, modification, annulation, plusieurs dates, reconnexion, expiration de jeton, double connexion et refus de consentement.
6. Exécuter tests/lint/build, vérifications de sécurité, recette, documentation, PR et procédure de clôture ; déployer seulement après preuves suffisantes.

## Dépendances / points de décision
- Enregistrement de l'application Microsoft Entra, autorisations/consentement et secrets : à configurer dans l'environnement adéquat ; aucune valeur sensible dans Git.
- Recette OAuth réelle sur compte Microsoft de test requise avant de déclarer la fonctionnalité opérationnelle.
- Ne pas exécuter de migration distante avant vérification explicite du projet Supabase lié.

## Critères d'acceptation
- Un formateur peut connecter puis déconnecter Microsoft sans toucher à Google.
- Le calendrier distinct n'est créé qu'une fois et les événements sont mis à jour sans doublons.
- Les missions personnelles et OF ainsi que leurs changements suivent les mêmes règles que Google V1.2.
- Aucune donnée d'un autre OF ou information personnelle non autorisée n'est exposée.
- Les erreurs de consentement, de jeton et d'API sont visibles et récupérables.
- La production Google continue de fonctionner, vérifiée par tests de non-régression.

**Statut : cadrage technique initial uniquement. Aucun développement fonctionnel ni test de synchronisation Microsoft n'est encore validé.**


## Reprise du 28 octobre 2026

Mandat : développement autonome, tests, préparation de production et clôture conditionnée à une recette réelle Microsoft. Branche/PR existantes conservées, aucune activation publique ni annonce.

Choix technique : trois tables Microsoft et trois RPC de verrouillage propres au fournisseur, triggers privés supplémentaires ; projection métier, chiffrement et snapshot de lecture Google réutilisés sans modification. Adapter uniquement les tables Google existantes aurait imposé une migration plus risquée de la production ; les réécrire aurait fait diverger les règles métier. Le petit dépôt de données Microsoft reprend les mêmes sémantiques de verrou ; chaque évolution commune devra être testée sur les deux fournisseurs.

Réalisé : OAuth serveur/state à usage unique/PKCE, identité UserInfo vérifiée côté Microsoft, jetons AES-GCM et rotation, création/récupération du calendrier marqué, réconciliation Graph avec identifiants persistants, reprise des erreurs, workers isolés, écran formateur, callback sécurisé/PWA, migration de confidentialité et script cron préparés. Tests unitaires, SQL, intégration PostgreSQL et navigateur ajoutés. Revue indépendante : colonnes SQL alignées, callback clôturé par verrou expiré, propriété du calendrier vérifiée avant mutation, POST ambigu jamais répété aveuglément.

Ordre restant : contrôles CI du dernier commit, configuration Entra et secrets, déploiement de recette isolée, recette des deux comptes Microsoft, vérifications de confidentialité/déploiement, ouverture, version/tag/archive/release et clôture. Voir OPERATIONS.md, ACCEPTANCE.md, LEGAL_REVIEW.md et CLOSURE.md pour les preuves et blocages. Version technique inchangée à 1.2.4 pendant la préparation ; cible de livraison 1.3.0, à appliquer au moment de la livraison validée.
