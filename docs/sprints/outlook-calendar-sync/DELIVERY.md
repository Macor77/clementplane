# Preuves de préparation — Outlook / Microsoft 365

28 octobre 2026. Aucune livraison publique. Ce document sera complété par la CI finale avant fin de session.

- PR #19, branche feature/outlook-calendar-sync.
- Premier commit intégré : 7309a85c5cefafda1ebc93dcc3e8da03952d1d6a.
- Première CI : https://github.com/Macor77/clementplane/actions/runs/40647831181 ; 311 tests unitaires/intégration réussis, SQL, audit et build réussis, 35/36 navigateur. Les cinq parcours Microsoft et huit parcours Google passent. Échec existant du popup mobile analysé, dépendance externe des polices neutralisée uniquement dans le test.
- Preuves navigateur fictives : https://github.com/Macor77/clementplane/actions/runs/40647831181/artifacts/12798416627 (rétention CI 7 jours). Images Microsoft 1440/390 inspectées ; aucun dépassement horizontal. L'en-tête fixe peut traverser la capture de section longue, sans masquer durablement les contrôles à l'écran.
- Contrôles locaux : Vitest 56 fichiers/311 tests ; ESLint 0 erreur/2 warnings préexistants ; build Vite+PWA réussi ; cinq scripts SQL (missions personnelles, versions légales, Google, Microsoft, revalidation) réussis. Tests avec URL Supabase fictive et clés de test publiques, aucun secret réel.
- Premier lancement local sans variables Vite : deux fichiers de tests ne pouvaient pas initialiser Supabase ; relance avec les variables CI réussie. Chromium local non disponible et téléchargement tronqué ; les preuves navigateur proviennent de GitHub Actions, pas d'une exécution locale réussie.
- Audit npm : 0 high/critical ; 4 moderate et 5 low, outils de développement (Vitest mocker, deepmerge/Workbox, fast-uri, serialize-javascript). Aucun `audit fix --force` appliqué.
- Supabase distant inspecté en lecture seule : projet clementplane hctvkynrgmnxjynbncdi ; fonctions Google v3 ACTIVE, cron clementplane-google-calendar actif toutes les minutes. Aucune migration/fonction/cron Microsoft installés. Historiques Google sous versions distantes du 14 octobre : pas de db push global.
- Vercel : projet prj_gNJbyUiPEIkj5ZPdJozxKbrmD3QE et équipe team_PbxydmCzCPS1tJewtRgkab7Y retrouvés ; liste des déploiements refusée 403 pour scope formaplane. Aucun déploiement prétendu vérifié.
- Revue indépendante : défaut de noms de colonnes, absence de fencing après expiration OAuth, ordre du contrôle de propriété du calendrier détectés et corrigés ; ajout d'une intégration réelle PostgreSQL pour ne pas se limiter aux mocks de base. POST ambigus traités sans recréation aveugle.

Pas de commit de production, tag, release ou archive de version livrée. La version 1.2.4 est conservée jusqu'à recette ; cible 1.3.0 documentée. Actions restantes et conditions d'ouverture : OPERATIONS.md, ACCEPTANCE.md et CLOSURE.md.
