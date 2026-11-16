# Exploitation — V1.5.1 publiée

Modification frontend uniquement. Aucun SQL, migration, RPC, RLS, fonction Edge, secret ou drapeau à appliquer. Les données privées restent dans les mêmes requêtes et tables ; les textes d’aide n’ajoutent aucune télémétrie ni notification. La consultation OF reste en lecture seule.

Recette : workflow Quality (tests unitaires/contrats, PostgreSQL/PGlite, audit, build, Playwright), scénario 17 pour les aides, scénarios 14–16 pour les bilans, dépenses et participations. Captures uniquement avec données fictives. Le navigateur local ne pouvant démarrer dans cet environnement, la recette navigateur est exécutée en CI. Les tests API simulés ne sont pas une recette métier de production ni un test sur appareil physique.

Publication autorisée le 16 novembre : PR #26 fusionnée et Vercel production vérifié. Le workflow release-v1.5.1 publie uniquement après Quality sur le commit documentaire exact ; références dans PRODUCTION.md. Retour arrière : redéployer V1.5.0, aucune donnée à restaurer. Aucun changement du service worker ou du mécanisme de mise à jour PWA.

En cas de difficulté d’accès à l’aide, vérifier le navigateur et conserver les saisies ; aucune fermeture d’aide ne doit soumettre le formulaire. Le composant natif dialog gère le fond inerte ; le démontage restaure le défilement.
