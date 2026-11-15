# Recette V1.4.0 — en cours

- 387 tests Vitest réussis, dont 20 nouveaux cas dépenses et 29 cas bilan/service.
- ESLint : aucune erreur, deux avertissements préexistants (usePlanningAvailability et TrainerSearch).
- Build de production réussi ; avertissement de bundle volumineux préexistant.
- SQL PGlite : les trois suites bilan passent. Migration vérifiée pour ancien montant/texte, zéro, aucun frais, texte sans montant, exactitude 0,10+0,20, édition/suppression, archives, non-duplication, CAS/reprise, transaction refusée sans modification, requêtes falsifiées, ancien client, droits propriétaire/OF/tiers/anonyme, absence de trigger agenda et structure d’agrégation future.
- PostgreSQL hébergé documentation-demo : recette scripts/testing/trainer-expenses-staging.sql réussie, transaction fictive annulée. Advisors sécurité inchangés.
- Revue indépendante : aucun défaut concret identifié. Nouveau bilan après migration vérifié en mémoire en complément.
- Parcours navigateur et inspection des captures : à terminer par CI. API simulées et identités fictives ; la preuve SQL hébergée couvre les véritables droits serveur.
- Limites : pas de saisie réelle en production, pas de test matériel iOS/Android installé ni de mesure de forte concurrence PostgreSQL. Le verrou transactionnel et le mécanisme CAS existants sont conservés.
