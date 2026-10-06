> Document historique de préparation. État final : PR #4 fusionnée le 6 octobre 2026 ; voir CLOSURE.md.

# feat: v0.21.1 — agenda autonome et missions personnelles du formateur

## Pourquoi
Le formateur ne pouvait alimenter son agenda qu’avec les missions reçues des OF inscrits. Cette évolution lui permet de centraliser lui-même ses interventions, sans imposer un compte à ses clients.

## Changements
Missions personnelles privées avec plusieurs dates, horaires, client libre/Mes OF, lieu, notes et rémunération HT avec unité ; création, édition et annulation. Intégration aux vues existantes et disponibilité quotidienne dérivée, sans écraser les déclarations manuelles. Propriété RLS, validation SQL, révision optimiste et suppression avec le compte. Aucun envoi automatique. Version v0.21.1, documentation et procédure de clôture actualisées.

## Vérifications
157 tests Vitest ; scénarios PostgreSQL/RLS et compatibilité des inscriptions ; API réelle CRUD/RLS et cycle OF/double espace validés sur documentation-demo ; PWA + parcours desktop/mobile Playwright avec API simulée ; build et lint (0 erreur, 2 avertissements préexistants). npm audit : 0 high/critical, 3 moderate Vitest. Revue indépendante et correction du lien depuis Mes disponibilités.

## Gates avant fusion
- Vérifier le résultat GitHub Actions sur le commit final.
- Appliquer `20261005113329_personal_trainer_missions.sql` puis `20261005135703_personal_missions_privacy_version_compatibility.sql` avant le frontend, après accord de production.
- Vérifier la CI, le déploiement, la version en ligne, puis tag/ZIP/release v0.21.1.

Les deux migrations sont appliquées uniquement à la branche de test explicitement autorisée. PR #4 publiée en brouillon. Aucun message envoyé, aucune fusion ni production déployée.
