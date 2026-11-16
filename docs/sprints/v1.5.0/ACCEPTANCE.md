# Recette candidate — 16 novembre 2026

| Exigence | État / preuve | Environnement |
|---|---|---|
| Effectifs inclus dans total, pas de doublon statistiques | Vérifié : 17 nouveaux tests unitaires, 406 tests au total | Local Vitest |
| Ajout, modification, suppression, données existantes | Vérifié : partial-attendance-sql.mjs | PostgreSQL PGlite local |
| RPC atomique, conflits, retry, ancien client | Vérifié : même suite SQL, quatre suites activité passent | PostgreSQL PGlite local |
| RLS propriétaire/OF/tiers/anon et champs privés | Vérifié : SQL local ; schéma/politiques demo inspectés | Local + lecture demo |
| Desktop/tablette/mobile, rechargement, erreur réseau | À vérifier : spec 16, 1440/768/390 px | Navigateur Chromium, API simulée |
| Intégration PostgreSQL hébergé | Bloqué : contrôle automatique exige autorisation explicite pour la migration demo | documentation-demo |
| Lint / build | Vérifiés ; 2 avertissements Hooks et gros bundle préexistants | Local |
| PWA installée sur appareil réel | Non exécuté, pas de modification du mécanisme PWA | — |
| Production | Non déployée ; autorisation V1.4.0 antérieure non étendue à ce sprint | — |

Le test navigateur simule l’API : il ne prouve pas une migration Supabase hébergée. Le scénario de recette hébergée reste à exécuter après autorisation.
