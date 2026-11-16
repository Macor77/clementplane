# Publication V1.5.1 — 16 novembre 2026

Vincent a explicitement autorisé : « Vas-y. Tu peux mettre en production. » Aucun envoi de message ou e-mail dans ce mandat.

## Livraison et contrôle du code

- PR [#26](https://github.com/Macor77/clementplane/pull/26), tête `87471bb4c8ff3ee65492d4bc464c20fd398f7255`, base `86832b7c5712ae1d05e52e44401f79c6d542ec34` inchangée avant fusion.
- Commit applicatif `873d3ffde95f253b14c0f68c6898bc01a0a44f97`. Les commits suivants ne changent que documentation, captures et procédure de release.
- [Quality candidate 43858430263](https://github.com/Macor77/clementplane/actions/runs/43858430263) réussie : 406 unitaires, 63 parcours navigateur, SQL/RLS, lint, audit et build. Revue indépendante sans anomalie importante.
- Fusion main `92a94bf6d8c7221983e22741a1106c8c86305e6b`, arbre `bad0521aa28c86a162b8c10bf22b6285d11be4bf` identique à la candidate. [Quality main 43867762939](https://github.com/Macor77/clementplane/actions/runs/43867762939). Contrôle du commit documentaire exact avant release.
- Vercel production `dpl_FELzSwNNBxridUZDaVuLfZfqVtCJ` READY, bon dépôt et commit de fusion. Alias app.clementplane.fr, www.clementplane.fr, clementplane.fr. Aucun drapeau limitant les aides aux testeurs ; pilote Outlook inchangé.

## Données et confidentialité

Aucun diff sur les services, utilitaires métier, schéma/migrations/RPC/RLS ou page de statistiques depuis V1.5.0. Les aides ne déclenchent aucune requête et aucun enregistrement. Consultation OF et champs privés conservés, vérifiés par les suites de non-régression. Aucun SQL, secret ou paramètre hébergé modifié ; aucun rejeu de migration. Les contrôles hébergés V1.5.0 documentés dans ../v1.5.0/PRODUCTION.md restent applicables au code inchangé ; ils ne sont pas présentés comme une nouvelle recette de base pour V1.5.1.

## Vérification en ligne

HTTP 200 sur https://app.clementplane.fr/, /formateur/statistiques et /formateur/missions/personnelles/fff15100-0000-4000-8000-000000000051 (identifiant fictif inexistant, shell seulement). Asset `/assets/index-CfdYDOxb.js` en HTTP 200 : V1.5.1, activity-help-dialog, showModal, aide des participations partielles et kilométrage réel présents. SHA-256 du bundle servi : `045a558e1bc269871be60f46f34c4284d34399132bc7dc489be6e5798bd7070c`.

Cela vérifie les routes et le code publié, pas un parcours connecté avec données réelles. Les scénarios navigateur utilisent une API simulée ; PostgreSQL/PGlite en CI. Aucun appareil physique/PWA installé ni restauration fournisseur testé pour ce correctif ; mécanisme de mise à jour existant inchangé. Les captures du vrai composant contiennent exclusivement des données fictives et sont archivées dans assets/.

## Clôture, archive et retour arrière

Le commit documentaire contenant `release-v1.5.1` conserve le même code applicatif. Après Quality, le workflow Release V1.5.1 sources vérifie la version et l’appartenance à main, produit l’archive exacte avec manifeste, publie tag/release, télécharge les pièces jointes puis contrôle SHA-256 et ZIP. Le tag vise ce commit documentaire ; SOURCE_COMMIT.txt dans l’archive et la release donnent sa référence exacte. Le succès effectif est vérifié avant le compte rendu final et reporté dans la PR.

[Release v1.5.1](https://github.com/Macor77/clementplane/releases/tag/v1.5.1) · [Workflow](https://github.com/Macor77/clementplane/actions/workflows/release-v1.5.1.yml).

Retour arrière : redéployer le frontend V1.5.0 ; aucune restauration ou modification de données nécessaire. Aucun message ou événement d’agenda ajouté.
