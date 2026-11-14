# Exploitation V1.3.2

## Publication autorisée et appliquée le 14 novembre 2026
Migration additive source `20261114194307_simplify_trainer_activity.sql`, appliquée sous `20261114200754` en production, puis application V1.3.2 issue de la PR #23. Recette : `20261114195629`. Voir PRODUCTION.md. Ne pas utiliser de db push global ; ne pas réappliquer les migrations historiques déjà déployées. Vérifier Quality, sauvegarde et versions avant exécution. En production : contrôles non destructifs, aucune saisie de bilan réel à la place d’un formateur.

La migration ajoute report_mode, summary, formation_title, reference_dates et activity_date. Elle conserve sessions sans modification, enrichit les anciens bilans depuis leurs sources et verrouille la structure historique. L’écriture reste atomique via la RPC existante, avec autorisation, révision et identifiant de reprise.

Les nouvelles requêtes contiennent summary et aucun titre, date ou groupe. Les anciens clients ne peuvent créer un bilan détaillé ni écraser un bilan simple : REPORT_APP_UPDATE_REQUIRED. Les anciens bilans détaillés peuvent encore corriger les réalisations mais pas leur structure. L’ancienne UI affiche une erreur générique ; actualiser via le mécanisme PWA V1.3.1. Déployer l’application juste après la migration pour réduire cette fenêtre de transition.

## Recette
Projet de recette uniquement : documentation-demo `jqhbrkyeawtsuzrzrnvm`, branche non par défaut du projet Clementplane. `scripts/testing/simple-activity-staging.sql` crée exclusivement des données fictives dans une transaction annulée ; aucun service externe. Les scénarios navigateur simulent les API et complètent les tests SQL réels, sans constituer un test utilisateur en production.

## Retour arrière
Ne supprimer aucune colonne ni aucun bilan. Un retour frontend V1.3.1 seul ne permet pas de lire/éditer les nouveaux totaux correctement (sessions peut être vide). Préférer un correctif V1.3.2 ou désactiver temporairement l’édition de bilan tout en gardant son affichage compatible. Ne pas convertir arbitrairement les totaux simples en journées détaillées. Pour les historiques convertis, sessions reste une archive et ne doit jamais être additionnée à summary.
