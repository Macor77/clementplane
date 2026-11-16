# Recette candidate — 16 novembre 2026

| Exigence | État / preuve | Environnement |
|---|---|---|
| Effectifs inclus dans total, pas de doublon statistiques | Vérifié : 17 nouveaux tests unitaires, 406 tests au total | Local Vitest |
| Ajout, modification, suppression, données existantes | Vérifié : partial-attendance-sql.mjs | PostgreSQL PGlite local |
| RPC atomique, conflits, retry, ancien client | Vérifié : même suite SQL, quatre suites activité passent | PostgreSQL PGlite local |
| RLS propriétaire/OF/tiers/anon et champs privés | Vérifié : SQL local ; schéma/politiques demo inspectés | Local + lecture demo |
| Desktop/tablette/mobile, rechargement, erreur réseau | Vérifié : 58 tests navigateur, dont 5 nouveaux parcours (spec 16), 1440/768/390 px ; captures examinées | Navigateur Chromium, API simulée |
| Intégration PostgreSQL hébergé | Bloqué : contrôle automatique exige autorisation explicite pour la migration demo | documentation-demo |
| Lint / build | Vérifiés ; 2 avertissements Hooks et gros bundle préexistants | Local |
| PWA installée sur appareil réel | Non exécuté, pas de modification du mécanisme PWA | — |
| Production | Non déployée ; autorisation V1.4.0 antérieure non étendue à ce sprint | — |

Le test navigateur simule l’API : il ne prouve pas une migration Supabase hébergée. Le scénario de recette hébergée reste à exécuter après autorisation.

Preuve CI applicative : [Quality 43821510095](https://github.com/Macor77/clementplane/actions/runs/43821510095), commit `4c1583058c6988ffdd7224228bf59f97970f6b19`, tous contrôles réussis. Les 406 tests sont également passés en CI. Tests SQL supplémentaires missions personnelles, droits, Google/Microsoft et revalidation réussis. Revue indépendante sans défaut bloquant ; même erreur après fermeture du volet testée et corrigée avant publication de la branche.

Audit npm CI : 12 vulnérabilités connues (3 faibles, 9 modérées), aucune haute/critique ; dépendances inchangées par ce sprint. Les deux avertissements Hooks et le gros bundle sont préexistants. Pas de test physique sur téléphone/PWA installée.

Artefact navigateur `14205365057` téléchargé ; ZIP valide ; captures partial-attendance-1440/768/390.png examinées. Données exclusivement fictives. Archive candidate `14205365066` téléchargée et vérifiée (ZIP, manifeste, chaque SHA-256), 678 fichiers, SHA-256 `93387068254a7d67cf6128eab90f7747b28b9337b95167cb5e1c3e6e978d1587`. Sa source est le commit de fusion synthétique de PR `a315ad4876cedbf17890cdea85ab0743a8173ac8`, incluant le commit applicatif ci-dessus ; aucune fusion dans main. Les mises à jour documentaires ultérieures ne modifient pas l’application.
