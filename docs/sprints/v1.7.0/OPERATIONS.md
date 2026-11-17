# Exploitation V1.7.0 — publiée le 17 novembre 2026

## Procédure appliquée après validation explicite
1. Vérifier la PR, son SHA et sa CI, puis sauvegarde fournisseur et état de la migration ciblée.
2. Appliquer uniquement `20261117134215_trainer_statistics_goals.sql` à l'environnement validé via l'outil de migration. Ne pas lancer un db push global : historique ancien divergent.
3. Contrôler la table, ses quatre politiques propriétaire/formateur et ses grants. Aucun objectif prérempli, aucun historique de bilan modifié.
4. Publier le frontend correspondant puis vérifier la version, les routes et les parcours avec compte de test fictif.
5. Vérifier le retour du SW/PWA et finaliser tag/release/archive seulement sur preuves.

La table des objectifs est la seule modification de schéma. Les frais continuent de provenir de `trainer_activity_private`, avec le filtre owner_user_id et la RLS existante. Le service de lecture OF n'accède pas à cette table. Ni kilomètres ni difficultés ne sont chargés pour les statistiques.

## Repli
Revenir au frontend V1.6.0 suffit ; conserver la table additive et les éventuels objectifs. Ne supprimer ni table ni données. Un échec de chargement des frais masque les totaux jusqu'à un nouvel essai. Une table d'objectifs indisponible n'empêche pas la lecture des statistiques.

## Validation
`npm test`, `npm run lint`, `npm run test:activity-sql`, build avec configuration de test, parcours Playwright 14–19 et suite Quality existante. Objectifs testés : create/update/delete/reload, propriétaire, autre formateur, OF, anonyme, falsification du propriétaire, contraintes et cascade.

Migration source 20261117134215 → version distante 20261117142308, même nom trainer_statistics_goals. Ne pas rejouer la source sous prétexte que son horodatage diffère. Aucune migration ancienne, fonction Edge ou configuration d’agenda modifiée.

Les outils exposés ne donnent pas accès à l’inventaire de sauvegardes fournisseur ; aucun état de sauvegarde/restauration n’est prétendu. Le risque a été limité par une migration transactionnelle créant uniquement une table absente, sans écriture dans les données existantes. Le repli frontend conserve les objectifs créés.
