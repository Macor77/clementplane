# Exploitation — candidat V1.4.0

## État au 15 novembre 2026

Production non autorisée pour cette évolution : aucune fusion, migration de production, release ou modification Vercel production. Le site public reste V1.3.2. La branche feature/v1.4.0-expense-items et sa PR brouillon portent le candidat.

Migration source : 20261115110744_trainer_expense_items.sql. Appliquée uniquement sur documentation-demo jqhbrkyeawtsuzrzrnvm sous la version hébergée 20261115111417. La recette SQL hébergée utilise uniquement des identités fictives dans une transaction annulée, scripts/testing/trainer-expenses-staging.sql. Aucun utilisateur réel sollicité.

Après validation explicite : vérifier la tête et la CI du candidat, les sauvegardes et l’état des migrations ; appliquer uniquement la nouvelle migration sur la production hctvkynrgmnxjynbncdi, puis publier le frontend. Ne pas lancer db push global : les anciennes migrations source et hébergées ont des versions distinctes, documentées dans les précédents sprints. Contrôles de production en lecture seule et vérification du déploiement READY.

Les anciennes PWA doivent actualiser pour enregistrer un bilan : le serveur bloque une requête sans expense_items pour éviter toute perte. Le mécanisme de mise à jour V1.3.1 est conservé. Réduire la fenêtre migration/frontend ; ne pas tester en saisissant le bilan d’un formateur réel.

## Retour arrière

Conserver toutes les colonnes et archives. Un retour au frontend V1.3.2 permet encore certaines lectures mais son enregistrement est intentionnellement bloqué. Ne jamais restaurer l’ancienne RPC qui pourrait écraser les totaux. Préférer un correctif compatible ou désactiver temporairement la saisie de bilan en conservant les données. Aucun rollback destructif automatique.

## Droits et diagnostics

Les nouveaux champs héritent de la table privée RLS owner_user_id=auth.uid ; aucun nouveau droit accordé. Recette locale PGlite et PostgreSQL hébergé réussies, OF/tiers refusés. Advisors sécurité recette inchangés avant/après : 23 informations no-policy, 2 search-path, 6 fonctions anonymes et 86 fonctions authentifiées historiques ; aucun constat nouveau sur activity_private/trainer_activity_private. Diagnostics historiques hors périmètre : https://supabase.com/docs/guides/database/database-linter .
