> **Production autorisée et publiée le 27 octobre 2026.** Voir `DEPLOYMENT.md` pour les preuves postérieures à cette recette.

# Validation — navigation multi-onglets

27 octobre 2026. Base main : `9e2ba74cbfcae5af9679b4bdfc09acddf464e1ff`.

## Matrice de recette
| Exigence | État | Preuve / environnement |
|---|---|---|
| Liens natifs missions et formateurs | Vérifié | Rendu React + Chromium, tests `newTabLinks` et `12-new-tab-navigation` |
| Clic droit conserve la page, Ctrl-clic et molette ouvrent une vraie page | Vérifié | Scénario navigateur mission, attentes sur l’URL et le contenu des nouveaux onglets |
| Cmd/Shift/Alt non interceptés | Vérifié en test de composant | `planningMissionLink.test.jsx` ; pas de navigateur Mac réel |
| Clic simple et fenêtre journée conservés | Vérifié | Plannings OF et formateur personnel ; 1440/390 px |
| Liens personnels/reçus existants | Vérifié pour les parcours ciblés | Scénarios existants missions personnelles, propositions/revalidation ; aucun changement du générateur missionHref |
| Double rôle, onglet neuf/espace formateur | Vérifié | URL OF directe et rechargement ; données fictives |
| OF seul, parcours revendication conservé | Vérifié | Test régression dédié ; rouge sur le build précédent, vert après restriction au double rôle |
| Session absente / formateur sans OF | Vérifié | Connexion requise / absence de données de mission OF ; API simulée |
| Droits serveur | Inchangés | Aucune migration, RPC ou requête de données modifiée ; tests SQL isolés passent |
| Mobile | Vérifié en simulation | Chromium 390 px ; chevauchement numéro/mission corrigé ; captures inspectées |
| Production et PWA installée réelle | Non exécuté | Mandat développement ; pas de fusion ni déploiement production |

## Contrôles
- `npm test` avec variables publiques fictives : **50 fichiers, 282 tests réussis**.
- `npm run lint` : **0 erreur**, 2 avertissements préexistants (dépendances d’effets dans usePlanningAvailability et TrainerSearch).
- `npm run build` : réussi ; avertissement existant de taille du bundle (>500 kB).
- Playwright : **31 scénarios réussis** (20 de non-régression, 11 nouveaux), Chromium 140 local, API simulée, données fictives. Le téléchargement Chromium 151 du runner local renvoyait une archive invalide ; utilisation d’un Chromium disponible sans modifier package.json/package-lock.
- Tests SQL isolés PGlite : missions personnelles/RLS, versions légales, Google Agenda, revalidation manuelle réussis. Ce contrôle ne prétend pas inspecter la base déployée.
- `npm audit --audit-level=high` : seuil satisfait, **5 avis existants (1 faible, 4 modérés), aucun élevé/critique**. Dépendances et lockfile inchangés ; mise à niveau majeure Vitest hors périmètre.
- Revue indépendante : chevauchement mobile, couleurs/tailles des éléments du planning et préservation de l’onboarding OF seul traités puis recette complète passée.

## Documentation et impacts
FAQ Découvrir complétée ; documentation fonctionnelle, roadmaps et changelogs datés « préparée, non publiée ». Aucun besoin de modifier les tutoriels/captures existants : clic simple conservé. Aucune nouvelle donnée collectée, aucun nouveau prestataire/traceur ou traitement : aucune modification nécessaire des CGU, confidentialité, mentions légales, politique traceurs, registre, DPA ou procédures internes.
Aucun e-mail de nouveautés demandé ou envoyé. Version applicative, tag, release et archive de publication à décider lors de la livraison ; pas de nouveau numéro présenté comme publié.

## État de livraison
Développement et recette locale terminés sur `feature/open-pages-new-tab`. Livraison préparée via PR vers main. Non intégré, non publié, sprint non clôturé. Retour arrière après éventuelle livraison : revert du commit frontend ; aucun rollback de base nécessaire.

### Écart du premier contrôle GitHub
Le run 40525193585 a validé tests, SQL, audit et build mais échoué dans la recette des onglets. Les traces montrent des onglets de destination créés sans requête API avant l’expiration de l’attente ; une fermeture suivie immédiatement d’un nouveau geste échouait aussi. Le scénario active maintenant explicitement l’onglet consulté et revient à la source après fermeture, comme un utilisateur. L’authentification fictive n’est plus réécrite à chaque nouvelle page dans le stockage partagé. Aucun changement applicatif lié à cet écart.
