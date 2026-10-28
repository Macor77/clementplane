> **État courant — 28 octobre 2026 : pilote restreint activé en production, PR #19 fusionnée.** Recette personnelle réelle réussie ; report du test Microsoft 365 professionnel explicitement accepté par Vincent pour ce pilote. Aucune ouverture générale ni clôture. [Preuves et actions restantes](PILOT.md). Les états antérieurs ci-dessous sont historiques.

> **Mise à jour :** les sections initiales ci-dessous sont historiques. Le backend Microsoft est maintenant déployé uniquement en recette isolée, en mode testing. Les preuves réelles et réserves courantes sont dans [REAL_ACCEPTANCE.md](REAL_ACCEPTANCE.md). Aucune livraison publique.

# Preuves de préparation — Outlook / Microsoft 365

28 octobre 2026. Aucune livraison publique. Contrôles de préparation terminés ; recette Microsoft réelle toujours requise.

- PR #19, branche feature/outlook-calendar-sync.
- Premier commit intégré : 7309a85c5cefafda1ebc93dcc3e8da03952d1d6a.
- Première CI : https://github.com/Macor77/clementplane/actions/runs/40647831181 ; 311 tests unitaires/intégration réussis, SQL, audit et build réussis, 35/36 navigateur. Les cinq parcours Microsoft et huit parcours Google passent. Échec existant du popup mobile analysé, dépendance externe des polices neutralisée uniquement dans le test.
- Preuves navigateur fictives : https://github.com/Macor77/clementplane/actions/runs/40647831181/artifacts/12798416627 (rétention CI 7 jours). Images Microsoft 1440/390 inspectées ; aucun dépassement horizontal. L'en-tête fixe peut traverser la capture de section longue, sans masquer durablement les contrôles à l'écran.
- Contrôles locaux : Vitest 56 fichiers/311 tests ; ESLint 0 erreur/2 warnings préexistants ; build Vite+PWA réussi ; cinq scripts SQL (missions personnelles, versions légales, Google, Microsoft, revalidation) réussis. Tests avec URL Supabase fictive et clés de test publiques, aucun secret réel.
- Premier lancement local sans variables Vite : deux fichiers de tests ne pouvaient pas initialiser Supabase ; relance avec les variables CI réussie. Chromium local non disponible et téléchargement tronqué ; les preuves navigateur proviennent de GitHub Actions, pas d'une exécution locale réussie.
- Audit npm : 0 high/critical ; 4 moderate et 5 low, outils de développement (Vitest mocker, deepmerge/Workbox, fast-uri, serialize-javascript). Aucun `audit fix --force` appliqué.
- Supabase distant inspecté en lecture seule : projet clementplane hctvkynrgmnxjynbncdi ; fonctions Google v3 ACTIVE, cron clementplane-google-calendar actif toutes les minutes. Aucune migration/fonction/cron Microsoft installés. Historiques Google sous versions distantes du 14 octobre : pas de db push global.
- Vercel : projet prj_gNJbyUiPEIkj5ZPdJozxKbrmD3QE et équipe team_PbxydmCzCPS1tJewtRgkab7Y retrouvés ; liste des déploiements refusée 403 pour scope formaplane. Le statut GitHub Vercel sur fc5bbf24 est success et pointe vers https://vercel.com/formaplane/clementplane/GCu8oLJmZbRwZUknH6tDBJDWnWkM ; ce signal de preview automatique ne prouve pas sa configuration ni les parcours. Aucun déploiement inspecté directement.
- Revue indépendante : défaut de noms de colonnes, absence de fencing après expiration OAuth, ordre du contrôle de propriété du calendrier détectés et corrigés ; ajout d'une intégration réelle PostgreSQL pour ne pas se limiter aux mocks de base. POST ambigus traités sans recréation aveugle.

Pas de commit de production, tag, release ou archive de version livrée. La version 1.2.4 est conservée jusqu'à recette ; cible 1.3.0 documentée. Actions restantes et conditions d'ouverture : OPERATIONS.md, ACCEPTANCE.md et CLOSURE.md.


## Contrôle final du code — 28 octobre 2026

- Commit applicatif de préparation : **fc5bbf24cfcc94ba5e975e2b77068ee12d547857**.
- **CI Quality réussie**, run [40649659774](https://github.com/Macor77/clementplane/actions/runs/40649659774), job 122686513728 : 56 fichiers / **311 tests Vitest**, **36/36 tests navigateur**, cinq scripts SQL, ESLint, audit seuil high et build Vite/PWA réussis. Aucun test ignoré pour masquer l'échec précédent.
- [Captures fictives finales](https://github.com/Macor77/clementplane/actions/runs/40649659774/artifacts/12799401542), artefact browser-acceptance, rétention 7 jours. Les preuves de synthèse et leurs références restent dans ce document au-delà de la rétention.
- Le test mobile préexistant passe après isolation du CDN de polices dans sa fixture ; le code applicatif de navigation est inchangé.
- Relecture indépendante de fc5bbf24 : aucun défaut important restant signalé ; 29 tests Microsoft relancés avec succès par le relecteur. Cette revue n'est pas une approbation GitHub humaine ni une recette Graph réelle.
- Complément final uniquement documentaire : consigne ces preuves, ne change aucun fichier applicatif. Son commit n'est pas une version de production. L'équivalence applicative se vérifie par le diff avec fc5bbf24.

**Statut final de session : développé et contrôlé en simulation, enregistré sur la PR #19 ; backend Microsoft non déployé, non activé publiquement, non clôturé.** Aucune modification distante Supabase, aucune fusion, aucun tag/release et aucun e-mail.

## Contrôle Vault et recette personnelle — 28 octobre 2026

Commit applicatif **2dbe8b7a116af1e64ebbe78bcf4b41af27a5b922**. CI Quality [40675890864](https://github.com/Macor77/clementplane/actions/runs/40675890864) réussie (merge de PR testé `455f71685516cd48966d5b4eb60721fe9e7f1d8f`) : 318 tests Vitest, SQL dont droits Vault, lint, audit et build. Tests navigateur : **35 réussis au premier passage, 1 réussi au retry** ; test de navigation formateur 1440px intermittent, attente du titre Camille Démo dépassée au premier passage. Ne pas annoncer 36 succès sans réserve. Les parcours Microsoft et Google passent au premier passage. [Artefact](https://github.com/Macor77/clementplane/actions/runs/40675890864/artifacts/12810276997), rétention 7 jours.

Preview Vercel **dpl_2PVNyoCxVHcNsiAS6md4GLjbveHj READY**, commit 2dbe8b7, cible non-production. Worker et cron Microsoft déployés seulement dans documentation-demo. Preuves réelles : [REAL_ACCEPTANCE.md](REAL_ACCEPTANCE.md). Déconnexion/reconnexion personnelle, création, modification et annulation réellement vérifiées ; aucun déploiement public ni clôture.


### Régression CI détectée sur le complément documentaire

Le run 40676900686 (f2568a6, mêmes fichiers applicatifs) a échoué : 34 tests navigateur réussis, un retry réussi et un échec persistant sur la navigation mobile par clic milieu. Les 318 tests Vitest, SQL, lint, audit et build passent. Trace 12810144291 inspectée : initialisation Web Storage sur un document about:blank opaque (SecurityError) et installation/précache du service worker pendant les tests d'onglets à API mockée.

Correction limitée à la fixture de navigation : initialisation de session seulement sur l'origine locale de l'application ; service workers bloqués uniquement dans cette spec de contrats réseau simulés. Les tests PWA et callbacks OAuth gardent leurs service workers et toutes les assertions de navigation sont conservées. Résultat de cette correction à vérifier en CI ; aucun changement applicatif ni de permissions utilisateur.


L'isolation seule n'a pas résolu le problème (run 40677743465 : 34 succès, 1 flaky, 1 échec de création native d'onglet). Playwright installé était 1.62.1. Le signalement amont https://github.com/microsoft/playwright/issues/42142 décrit exactement cette régression de Chromium/headless-shell (clic milieu/Control, onglet absent ou restant vide), reproduite à partir de 1.62.0 et absente de 1.61.1 dans les essais publiés. @playwright/test est donc fixé exactement à **1.61.1**, lockfile concordant. Le blocage expérimental des service workers est retiré ; la garde de stockage sur origine opaque reste. Aucun test supprimé, aucun délai ou retry augmenté. Vérification par une nouvelle CI complète requise.
