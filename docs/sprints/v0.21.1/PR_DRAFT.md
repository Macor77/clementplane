# feat: v0.21.1 — agenda autonome et missions personnelles du formateur

## Pourquoi
Le formateur ne pouvait alimenter son agenda qu’avec les missions reçues des OF inscrits. Cette évolution lui permet de centraliser lui-même ses interventions, sans imposer un compte à ses clients.

## Changements
Missions personnelles privées avec plusieurs dates, horaires, client libre/Mes OF, lieu, notes et rémunération HT avec unité ; création, édition et annulation. Intégration aux vues existantes et disponibilité quotidienne dérivée, sans écraser les déclarations manuelles. Propriété RLS, validation SQL, révision optimiste et suppression avec le compte. Aucun envoi automatique. Version v0.21.1, documentation et procédure de clôture actualisées.

## Vérifications
157 tests Vitest ; scénario PostgreSQL/RLS isolé ; PWA + parcours desktop/mobile Playwright avec API simulée ; build et lint (0 erreur, 2 avertissements préexistants). npm audit : 0 high/critical, 3 moderate Vitest. Revue indépendante et correction du lien depuis Mes disponibilités.

## Gates avant fusion
- Recette connectée et non-régression OF/double espace sur Supabase de test autorisé.
- Migration additive `20261005113329_personal_trainer_missions.sql` avant déploiement frontend, après accord de production.
- Vérifier la CI, le déploiement, la version en ligne, puis tag/ZIP/release v0.21.1.

Aucune base distante modifiée ; aucune production déployée. Le contrôle automatique a bloqué la migration de test et le push public ; cette description est préparée pour la PR, non publiée.
