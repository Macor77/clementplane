# Progress — docs/sprints/v1.2/PLAN.md
- Audit initial effectué ; base 159 tests PASS (variables Supabase fictives nécessaires).
- Décision : le mandat autonome dispense de redemander les validations de conception courantes. Production demeure un gate explicite.
- Interfaces projection/provider/persistence planifiées ; aucune divergence identifiée.
- Google Cloud non accessible par les plugins trouvés ; recette réelle et publication OAuth restent des gates externes.
- Task 1: projection/provider/chiffrement tests RED puis 31 PASS. Tests explicites états, journées, DST, revalidation, options, tombstone, concurrence, collision, erreur/quota.
- Task 2: migration additive et fixture SQL isolée. Une erreur de fixture (table sans schéma sous search_path vide) corrigée ; le schéma réel utilise bien public.
- Task 3 : API utilisateur, OAuth PKCE, worker autonome et borne d'exécution implémentés. Reprise par cycle persistée pour les lots interrompus.
- Revue indépendante réalisée sur 5f4ef50..c91f827. Quatre problèmes importants reproduits : déconnexion/OAuth, générations après annulations répétées, reprise 412/DB temporaire, dates temporairement vides. Correctifs avec tests RED→GREEN ; suite 207/207 PASS, SQL PASS.
- Décision de revue : aucune validation Google réelle, scheduler de recette ou partage Google ne peut être déclarée sans accès au projet/comptes de test. Coût si ignoré : intégration impossible à qualifier pour la production ; conservé comme gate bloquant.
- Mineur différé : après un refus OAuth, l'état peut rester en chargement jusqu'au rafraîchissement manuel ou périodique (15 s). Le message d'erreur est immédiat. À examiner lors de la recette OAuth.
- Contrôle UI local bloqué : binaire Chromium absent ; tentative d'installation sans binaire utilisable. Scénarios desktop/mobile/callback ajoutés au workflow Quality pour exécution GitHub.
- Notice confidentialité du 08/10 ajoutée en préversion, avec migration de compatibilité préservant les deux versions précédentes. Test SQL inscriptions compatible PASS.
- Premier passage GitHub Actions : tests, SQL, audit et build PASS ; 4 scénarios navigateur PASS et 2 FAIL sur l'assertion synchrone check() d'une case contrôlée par réponse serveur. Test corrigé pour cliquer puis attendre l'état confirmé ; les valeurs effectivement envoyées restent vérifiées. Nouvelle exécution requise.

- Relance Quality 37737354470 sur 45c12ce : 207 tests + SQL + audit + build + 6 scénarios navigateur PASS. Captures desktop/mobile fictives inspectées ; aucun débordement horizontal détecté. Le bandeau fixe mobile peut recouvrir du contenu dans une capture longue de composant, selon la position de défilement. Recette Google réelle toujours non réalisée.

- Reprise autorisée : release GitHub brouillon créée avec archive ; Google Cloud indisponible dans le navigateur. Base isolée documentation-demo retrouvée et prérequis contrôlés en lecture seule. Tentative de migration refusée par auto-review avant exécution : accord explicite demandé, aucun contournement ni mutation de base.
