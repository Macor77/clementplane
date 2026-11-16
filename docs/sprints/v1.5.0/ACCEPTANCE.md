# Recette V1.5.0 — 16 novembre 2026

| Exigence | État / preuve | Environnement |
|---|---|---|
| Effectifs inclus dans total, pas de doublon statistiques | Vérifié : 17 nouveaux tests unitaires, 406 tests au total | Local Vitest |
| Ajout, modification, suppression, données existantes | Vérifié : partial-attendance-sql.mjs | PostgreSQL PGlite local |
| RPC atomique, conflits, retry, ancien client | Vérifié : même suite SQL, quatre suites activité passent | PostgreSQL PGlite local |
| RLS propriétaire/OF/tiers/anon et champs privés | Vérifié : SQL local ; schéma/politiques demo inspectés | Local + lecture demo |
| Desktop/tablette/mobile, rechargement, erreur réseau | Vérifié : 58 tests navigateur, dont 5 nouveaux parcours (spec 16), 1440/768/390 px ; captures examinées | Navigateur Chromium, API simulée |
| Intégration PostgreSQL hébergé | Vérifié après accord explicite : migration `20261116095029`, recette transactionnelle réussie, rollback confirmé | documentation-demo |
| Lint / build | Vérifiés ; 2 avertissements Hooks et gros bundle préexistants | Local |
| PWA installée sur appareil réel | Non exécuté, pas de modification du mécanisme PWA | — |
| Production | Autorisation spécifique reçue ; migration et déploiement vérifiés, trois bilans intacts | PRODUCTION.md |

Le test navigateur simule l’API : il ne prouve pas une migration Supabase hébergée. Le scénario SQL hébergé a été exécuté séparément et réussi après autorisation explicite ; ce contrôle ne constitue pas un parcours navigateur connecté au backend hébergé.

Preuve CI applicative : [Quality 43821510095](https://github.com/Macor77/clementplane/actions/runs/43821510095), commit `4c1583058c6988ffdd7224228bf59f97970f6b19`, tous contrôles réussis. Les 406 tests sont également passés en CI. Tests SQL supplémentaires missions personnelles, droits, Google/Microsoft et revalidation réussis. Revue indépendante sans défaut bloquant ; même erreur après fermeture du volet testée et corrigée avant publication de la branche.

Audit npm CI : 12 vulnérabilités connues (3 faibles, 9 modérées), aucune haute/critique ; dépendances inchangées par ce sprint. Les deux avertissements Hooks et le gros bundle sont préexistants. Pas de test physique sur téléphone/PWA installée.

Artefact navigateur `14205365057` téléchargé ; ZIP valide ; captures partial-attendance-1440/768/390.png examinées. Données exclusivement fictives. Archive candidate `14205365066` téléchargée et vérifiée (ZIP, manifeste, chaque SHA-256), 678 fichiers, SHA-256 `93387068254a7d67cf6128eab90f7747b28b9337b95167cb5e1c3e6e978d1587`. Sa source est le commit de fusion synthétique de PR `a315ad4876cedbf17890cdea85ab0743a8173ac8`, incluant le commit applicatif ci-dessus ; aucune fusion dans main. Les mises à jour documentaires ultérieures ne modifient pas l’application.

Validation complémentaire du 16 novembre : [Quality 43822206255](https://github.com/Macor77/clementplane/actions/runs/43822206255) réussie sur `eb1bad0150fb7acaa62c5b305839f7396b8b89da`. Recette PostgreSQL réelle sur documentation-demo réussie : sous-total, sauvegarde, modification, suppression, retry, protection ancien client, droits OF/tiers et frais privés. Empreinte des deux tables avant/après identique (`d751713988987e9331980363e24189ce`, zéro ligne), aucun compte/organisme de test restant. Préservation de données historiques non vides prouvée localement ; la base demo n’en contenait pas. Fonctions déployées identiques aux sources et advisors inchangés : voir OPERATIONS.md.

Publication : Quality candidat `43843828444` réussie sur la tête exacte `d3ee7b80d4afc946c60b3048c51bc1bb5a4a952e`. Fusion `9cad9cb3881afcaad5892b4541899282e26242a1` de même arbre. Migration production `20261116095526` et Vercel READY ; contrôles sans données métier écrites. La CI du commit de clôture contrôle aussi le workflow de release avant génération de l’archive finale.
