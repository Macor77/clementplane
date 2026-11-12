# Correction PWA — adresse officielle (V1.3.1)

## Périmètre approuvé

Le 12 novembre 2026, Vincent demande d’appliquer les corrections proposées après avoir confirmé le fonctionnement de sa nouvelle installation. L’ancienne icône était liée à un déploiement Vercel individuel désormais supprimé. Une PWA liée à cette origine ne peut pas être migrée par un correctif publié sur une autre origine.

Objectif : les invitations d’installation de l’application et les liens automatiques des e-mails de nouveautés doivent conduire à https://app.clementplane.fr. Préparer un message de remplacement des anciennes installations, sans l’envoyer. Aucun changement de données métier, de calendrier ou de droits.

## Étapes

1. Reproduire par un test du véritable gestionnaire Edge les liens incorrects envoyés par un ancien client transmettant `appBaseUrl`. Simuler exclusivement Supabase et Brevo.
2. Tester le parcours mobile sur origine temporaire et officielle, Android et iOS, ainsi que l’application déjà installée. Utiliser une API fictive et le bundle local dans Playwright.
3. Corriger `PwaManager.jsx` : lien normal vers l’origine officielle avant toute installation ailleurs, prompt Android et aide iOS préservés sur l’origine officielle. Ne pas rediriger les prévisualisations globalement et ne pas transférer de session ou de paramètres.
4. Fixer l’origine dans `send-feature-announcement/index.ts` côté serveur, supprimer `appBaseUrl` côté interface. Conserver authentification, préférences et désabonnement.
5. Actualiser aide, version, documentation et brouillon de communication. Exécuter lint, tests, build, audit et CI complète ; revue indépendante de la branche avant publication.
6. Déployer uniquement la fonction concernée avec JWT conservé, intégrer la branche après contrôles, vérifier Vercel et la fonction réellement publiée. Clôturer les preuves techniques et publier l’archive de sources.

## Critères et limites

- Sur adresse temporaire : aucune invocation du prompt local ; bouton vers l’adresse officielle sans paramètres.
- Sur adresse officielle : installation Android et instructions iOS disponibles ; aucune invitation dans une PWA déjà installée.
- Ancien client d’administration : liens de connexion ET désabonnement toujours officiels, y compris en mode test ; jeton de désabonnement préservé.
- Aucun e-mail réel lors de la recette. Aucune migration SQL ni nouveau traceur.
- Le menu d’installation natif du navigateur n’est pas sous le contrôle de l’application. Une ancienne installation figée ne recevra pas le nouveau bandeau. La communication reste une action distincte à faire autoriser.

## Suivi

- Diagnostic et périmètre confirmés ; branche isolée `fix/pwa-official-installation` depuis `7d3a7dd`.
- Implémentation, revue indépendante, contrôles complets et publication réalisés (PR #22). Deux ajustements de recette/release après revue : chemin explicite du dossier de clôture dans l’archive et observation de toutes les écritures simulées ; attente de fin de navigation dans les tests mobiles. Aucun écart de périmètre produit.
- Recette, production et preuves finales : `docs/sprints/pwa-official-installation/CLOSURE.md`.
