# v0.21.1 — suivi de clôture

**Statut : développé et vérifié localement ; migrations et recette API distante validées ; recette navigateur connectée validée ; production non réalisée. Sprint non clos.**

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
| Supabase | Deux migrations appliquées sur documentation-demo après autorisation explicite ; production inchangée |
| Recette connectée, OF et double espace | API CRUD/RLS et cycle OF validés ; navigateur desktop/mobile validé |
| Documentation et changelogs | Actualisés avec statut de préparation |
| Roadmaps | Synchronisées sur v0.21.1, sans prétendre à une livraison |
| Version affichée | v0.21.1 dans le code ; production non vérifiée |
| GitHub | Branche publiée et PR brouillon #4 créée après autorisation explicite ; aucune fusion |
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

## Recette distante autorisée et production restante
L’utilisateur a directement autorisé la publication publique de la branche/PR et l’utilisation de **documentation-demo**, projet **jqhbrkyeawtsuzrzrnvm**. Les deux migrations v0.21.1 y sont appliquées sans réinitialisation. Les fixtures sont isolées et fictives ; aucun envoi de message.

- API réelle : création, relecture, modification, révision, annulation, doublon UUID, RLS autre formateur/OF/anon, propriétaires immuables et disponibilités manuelles préservées.
- Cycle OF réel : acceptation malgré chevauchement personnel, affectation, modification/revalidation, réaffectation et annulation. Cloisonnement inter-OF, double espace et conservation de l’engagement personnel validés.
- Navigateur connecté : 2 tests passent (1440/390 px), création/rechargement/modification/liens/planning/annulation, accès étranger refusé, zéro appel de notification. Captures fictives contrôlées.
- Nettoyage : zéro compte/formateur/OF/mission de recette restant ; cascade Auth des missions personnelles vérifiée avant suppression des formateurs. Zéro journal d’e-mail pour les comptes fictifs. Les relations mission/formateur sont supprimées avant la mission pour respecter le trigger historique existant.
- Inscriptions : test SQL de l’ancienne et nouvelle notice, acknowledgments obligatoires et version exacte persistée ; les comptes fictifs ont été créés avec la nouvelle version.

La production requiert un accord distinct, après recette : les deux migrations ciblées avant frontend, fusion/déploiement, vérification en ligne, tag v0.21.1, ZIP et release. `tutorial_analytics` apparaît dans git mais pas dans l’historique distant inspecté : ne pas exécuter un `db push` global à l’aveugle.

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

## Publication GitHub
PR brouillon : https://github.com/Macor77/clementplane/pull/4. Dépôt public autorisé explicitement. L’aperçu Vercel du premier commit publié est réussi ; aucun résultat GitHub Actions remonté au contrôle. Ne pas confondre aperçu et déploiement de production.

## Reproduire la recette connectée
Les scripts `personal-missions-login.mjs`, `personal-missions-connected.mjs` et `personal-missions-of-connected.mjs` nécessitent des fixtures fictives précréées hors du dépôt : credentials.json (project, quatre users/emails/password, deux trainers, deux orgs, mission et relation de proposition avec token), public-key.json (url et clé anon publique), sessions.json généré par login. Ne jamais archiver ces fichiers. Les deux premiers comptes sont formateurs, les deux suivants propriétaires d’OF ; le premier formateur a aussi un espace OF. Les relations OF/formateurs et dates de mission sont définies pour octobre 2026. Les scripts API s’exécutent dans cet ordre : login, personal-missions-connected, personal-missions-of-connected ; ils produisent des comptes rendus locaux sans credentials. Le scénario navigateur se lance ensuite, sans mocks métier.

Fournir explicitement `E2E_PERSONAL_DATA_DIR` (dossier externe, terminé par /) et `E2E_PROJECT_REF`. Les scripts refusent la production et les projets incohérents. Renouveler les sessions avant la recette. Pour une recette ultérieure, adapter ensemble les dates fixtures/API/navigateur et le mois affiché. Ne pas réutiliser ces fixtures pour un deuxième cycle OF après annulation terminale.

Le Chromium isolé de cet environnement a nécessité `PLAYWRIGHT_PROXY` et `PLAYWRIGHT_TEST_PROXY_TLS=1` pour son proxy de test. Ce réglage TLS est limité à Playwright, désactivé par défaut et n’affecte pas l’application. Les assertions connectées attendent jusqu’à 30 s pour les latences réseau. Les traces de recette sont exclues du lint et de git.
