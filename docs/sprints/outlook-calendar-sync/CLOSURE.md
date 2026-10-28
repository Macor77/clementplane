> **État actualisé :** Entra configuré et backend déployé en recette isolée. Connexion personnelle, créations/modifications/retraits et reconnexion réels réussis. Voir [REAL_ACCEPTANCE.md](REAL_ACCEPTANCE.md). Les anciennes étapes ci-dessous restent historiques. Recette professionnelle et clôture non terminées ; aucune activation publique.

# Outlook / Microsoft 365 — bilan au 28 octobre 2026

**Verdict : non clôturé — configuration et recette Microsoft réelles, livraison puis clôture restantes.** Aucun tag/release public, aucune fusion et aucune activation Microsoft en production. Aucune réserve acceptée implicitement. Aucun mail envoyé.

## Références

- Branche existante `feature/outlook-calendar-sync`, [PR #19](https://github.com/Macor77/clementplane/pull/19), conservée en brouillon.
- Base de reprise `9528797852143a8b618c854af181d1454e2a3083` (7 commits de préparation dont ceux cités par Vincent), base main `031434830760d92b33b10fcd4ae02014bd0f3b99`.
- Première intégration `7309a85c5cefafda1ebc93dcc3e8da03952d1d6a` ; compléments et SHA final suivis dans DELIVERY.md.
- [Première CI 40647831181](https://github.com/Macor77/clementplane/actions/runs/40647831181) : tests/SQL/audit/build réussis ; 35/36 tests navigateur réussis. Un test existant de navigation mobile a échoué sur un popup vide ; trace analysée, chargement CSS externe des polices isolé dans le test. Résultat final et preuve du correctif dans DELIVERY.md.

**Contrôle final du code : CI [40649659774](https://github.com/Macor77/clementplane/actions/runs/40649659774) réussie sur `fc5bbf24` : 311 tests Vitest, 36 tests navigateur, SQL, lint, audit et build.** Voir DELIVERY.md. La réussite de cette CI ne lève pas le gate Microsoft réel.

## Matrice obligatoire

| Contrôle | État, preuve et environnement | Reste |
|---|---|---|
| Périmètre | Implémentation sur la branche : connexion facultative, deux fournisseurs, calendrier dédié, règles métier partagées, retraits/reconnexions ; tests simulés | Recette réelle de tous les parcours ACCEPTANCE |
| Développement | Code serveur, UI, deux migrations, scheduler préparé ; revue indépendante et correctifs intégrés | Corriger toute divergence observée chez Microsoft avant activation |
| Recette | 311 tests Vitest et 36 tests navigateur en CI finale, SQL et intégration PostgreSQL avec Graph simulé ; Microsoft 5 parcours 1440/390 réussis | Comptes personnel/professionnel, consentement, permissions et PWA installée réelle |
| Supabase | Lecture du projet production `hctvkynrgmnxjynbncdi`, Google functions v3 actives et cron minute actif ; aucune fonction/migration Microsoft distante. Tests PGlite RLS/grants/RPC/cascade et flux handler/worker | Appliquer les deux migrations ciblées, déployer les deux fonctions et vérifier l'état réel lors de recette ; aucun db push global |
| Qualité/CI | Lint sans erreur, 2 warnings préexistants (usePlanningAvailability, TrainerSearch). Build réussi, avertissement chunk volumineux préexistant. Audit : 0 high/critical, 4 moderate et 5 low sur outils de développement | CI finale réussie (DELIVERY) ; migration majeure des outils de test hors périmètre |
| Production | Backend Microsoft non déployé et aucune activation publique. GitHub signale la preview Vercel fc5bbf24 réussie ; inspection directe refusée pour scope équipe formaplane (403) | Autoriser l'équipe puis vérifier commit/configuration/callback/headers et disponibilité réelle |
| Documentation | Plan, architecture, base, PRD, tests, dépannage, registre et exploitation actualisés | Consigner les preuves réelles de livraison |
| Impact légal/RGPD | Revue technique LEGAL_REVIEW ; notice Microsoft et stockage session conditionnels, compatibilité inscriptions testée ; procédures internes mises à jour | Conditions Microsoft applicables, gouvernance et logs amont à qualifier avant ouverture |
| Roadmap/backlog | Racine/docs synchronisées : en préparation, non livré ; aucune fonctionnalité annoncée comme publiquement ouverte | Marquer livré après activation vérifiée |
| Changelog/notes | Entrée Non publié ; fonctionnalités et limites exposées | Date et notes finales au moment de la livraison |
| Version affichée | Version technique/lock/UI restent 1.2.4 ; Outlook non livré | Cible 1.3.0 après recette, cohérence package/lock/discoverContent et tag |
| GitHub | Travail enregistré sur PR existante, revue indépendante réalisée ; aucune approbation humaine inventée | CI finale puis fusion lorsque tous les gates sont levés |
| Tag | Non créé : recette réelle et livraison manquantes | Tag exact de la version effectivement livrée ; ne déplacer aucun tag |
| Archive | Procédure existante archive-sprint.py identifiée ; pas de fausse archive de version livrée | ZIP du commit exact, manifeste/checksum, ouverture et téléchargement vérifiés après livraison |
| Release | Non publiée, faute de recette et déploiement | Notes, tag et archive concordants après validation |
| Évolutions envisagées | Revue discoverContent : aucune entrée Outlook déjà promise à retirer ; aide/description préparées sous flag | Recontrôler affichage public lors ouverture |
| Découvrir Clementplane | Tutoriel textuel et FAQ Microsoft préparés sous flag ; captures CI fictives, aucune donnée client. Bibliothèque PDF/landing inchangées : pas de parcours Microsoft public à illustrer avant recette | Vérifier contenu activé et captures finales ; pas de promesse de PWA installée non testée |
| Communication | Aucun envoi. Brouillon de contenu et cible formateurs dans RETOUR_PILOTAGE | Autorisation d'envoi distincte, après ouverture seulement |
| Bilan/pilotage | CLOSURE/RETOUR_PILOTAGE/DELIVERY consignent état et actions | Clôture uniquement après satisfaction des obligations |

## Risques/limites conservés explicitement

- Microsoft `Calendars.ReadWrite` accorde plus de droits que le seul calendrier créé. Le code restreint les opérations au calendrier marqué, mais ne prétend pas à une restriction technique de la permission Microsoft.
- Pas de suppression automatique des copies distantes ni de révocation globale Microsoft à la déconnexion ; le jeton local est effacé, le titulaire peut retirer l'application.
- POST dont le résultat est incertain : priorité à l'absence de duplication, intervention de support possible si aucun marqueur retrouvé.
- L'absence de données dans le navigateur et les headers callback ne certifient pas les journaux de l'hébergeur.
- Les résultats Google antérieurs ne qualifient pas une connexion Microsoft réelle. Aucune donnée client utilisée pour test destructif.
