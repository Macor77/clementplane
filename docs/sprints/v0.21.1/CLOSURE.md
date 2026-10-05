# v0.21.1 — suivi de clôture

**Statut : développé et vérifié localement, recette distante et production non réalisées. Sprint non clos.**

## Référence et preuves
Base : main 97e13a1e6e68824dba77c5349d46951b5e0da588. Branche : feature/v0.21.1-personal-missions. Cible : v0.21.1 (package, lock et version UI alignés). Aucun changement de production.

- Vitest : 157 tests / 33 fichiers passent, avec variables de test CI.
- SQL PostgreSQL isolé (PGlite) : migration exécutée ; propriétaire/autre formateur/OF/anon, accès direct, propriété immuable, dates invalides et doublons, chevauchements, changement de dates, annulation, disponibilités manuelles préservées, suppression du compte en cascade. Fixtures minimales : ce test ne remplace pas la recette du schéma Supabase complet.
- Playwright : 3 tests passent (PWA et parcours personnel 1440 px / 390 px). API simulée, aucune donnée réelle. Création, erreur réseau avec saisies conservées, rechargement, modification, accueil, liens disponibilités desktop/mobile, compte multidate, planning, annulation ; zéro appel de notification.
- Build de production : réussi. Avertissement de taille du bundle déjà présent, non traité dans ce sprint.
- ESLint : 0 erreur, 2 avertissements préexistants (usePlanningAvailability, TrainerSearch).
- npm audit : 0 high/critical, 3 moderate sur Vitest/@vitest/mocker/@vitest/coverage-v8. Pas de mise à jour majeure aveugle.
- Revue indépendante : lien personnel incorrect depuis Mes disponibilités identifié et corrigé ; recette navigateur couvre les deux variantes.
- Capture mobile contrôlée visuellement, entièrement fictive ; tutoriel source ajouté.

## Procédure du dépôt — contrôle explicite
| Étape obligatoire | État |
|---|---|
| Développement et correction | Préparés sur branche dédiée |
| Recette locale | Validée comme indiqué ci-dessus |
| Supabase | Production inspectée en lecture, migration non appliquée |
| Recette connectée, OF et double espace | À faire sur environnement autorisé |
| Documentation et changelogs | Actualisés avec statut de préparation |
| Roadmaps | Synchronisées sur v0.21.1, sans prétendre à une livraison |
| Version affichée | v0.21.1 dans le code ; production non vérifiée |
| GitHub | Commit local réalisé ; push refusé par contrôle automatique, PR non créée |
| Vercel et version en ligne | Non déployés ; accord requis |
| Tag et release | Notes rédigées ; tag final et release publiable différés |
| Archive | Script reproductible de préparation ; archive finale à régénérer sur commit livré |
| Découvrir / FAQ / tutoriels | Revue effectuée, contenus et capture fictive actualisés |
| Évolutions envisagées | Mission personnelle retirée des fonctions futures dans le code destiné au prochain déploiement |
| E-mail nouveautés | Pertinent pour les formateurs après livraison ; aucun envoi autorisé ou effectué |

## Revue d’impact légal / RGPD
- Politique de confidentialité et version privacy : catégories de données personnelles et cloisonnement précisés.
- Registre : traitement des missions personnelles ajouté.
- Conservation et droits : table privée incluse ; annulation distincte de l’effacement ; suppression Auth testée en cascade.
- CGU : fonctions de missions/planning et responsabilité de saisie déjà couvertes ; aucune modification contractuelle proposée dans ce sprint.
- Mentions légales : aucune modification nécessaire (éditeur/hébergement inchangés).
- Cookies/traceurs : aucune modification nécessaire, aucun nouveau stockage persistant métier ni traceur.
- Sous-traitants/DPA : aucune modification nécessaire pour ce périmètre ; aucun nouveau prestataire de production.
- Procédure de violation : inchangée ; droits : périmètre de recherche complété.
Cette revue porte sur l’impact fonctionnel du changement, pas sur un nouvel audit juridique global.

## Blocage distant et autorisation précise attendue
Le contrôle automatique a refusé `apply_migration` sur la branche existante **documentation-demo**, projet **jqhbrkyeawtsuzrzrnvm** (parent production hctvkynrgmnxjynbncdi). Motif : mutation distante de schéma/RPC sensibles sur un projet non explicitement autorisé. Aucune tentative indirecte ni aucune modification distante.

Demander l’autorisation d’utiliser cette branche de test pour appliquer **uniquement** `20261005113329_personal_trainer_missions.sql`, créer des données fictives isolées, exécuter la recette connectée et nettoyer ces seules données. Ne pas réinitialiser la branche ; ne pas toucher à ses données existantes ni envoyer des messages. Son état MIGRATIONS_FAILED doit être vérifié avant mutation ; le schéma de base est présent, mais la compatibilité complète reste à contrôler.

La production requiert ensuite un accord distinct, après recette : migration additive, déploiement frontend, vérification, tag v0.21.1, ZIP et release. `tutorial_analytics` apparaît dans git mais pas dans l’historique distant inspecté : ne pas exécuter un `db push` global à l’aveugle.

## Reproduction
```sh
npm ci
VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=ci-test-anon-key npm test
npm run test:personal-sql
npm run lint
VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=ci-test-anon-key npm run build
npx playwright install --with-deps chromium
npx playwright test tests/e2e/specs/05-pwa-shell.spec.js tests/e2e/specs/06-personal-missions-ui.spec.js
```
Dans cet environnement, le téléchargement Playwright était incomplet : exécution avec Chromium 153 installé séparément, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` et `PLAYWRIGHT_VIDEO_OFF=1`. La CI utilise l’installation standard ; résultat CI à contrôler sur la PR.

## Blocage de publication GitHub
Le dépôt Macor77/clementplane est **public** (vérifié via connecteur, propriétaire Macor77, droits push/admin confirmés). Le contrôle automatique a refusé le push, puis l’a refusé à nouveau après vérification du dépôt et contrôle des ajouts, au motif que le texte joint ne constituait pas une autorisation utilisateur directe de publication publique. Aucun autre moyen de push n’a été tenté. La PR n’est pas créée. Demander une autorisation directement dans la conversation pour publier le code et la documentation de cette branche sur ce dépôt public.
