# Exploitation — V1.4.0 publiée

## État au 15 novembre 2026

Vincent a validé le candidat puis autorisé la production le 15 novembre 2026. PR #24 fusionnée au commit 46fe8711b6ff8c073a4e34f89bf2613d8ddfe295 ; Vercel dpl_5GSirpiLDUGcwCHfcuCGny1m2FvZ READY sur app.clementplane.fr. La clôture documentaire ne change pas le code applicatif. Voir PRODUCTION.md.

Migration source : 20261115110744_trainer_expense_items.sql. Appliquée sur documentation-demo jqhbrkyeawtsuzrzrnvm sous 20261115111417 puis en production hctvkynrgmnxjynbncdi sous 20261115114709 après autorisation. La recette SQL hébergée utilise uniquement des identités fictives dans une transaction annulée, scripts/testing/trainer-expenses-staging.sql. Aucun utilisateur réel sollicité.

Publication effectuée : version et CI contrôlées, empreintes des données d’origine comparées avant/après, migration ciblée puis frontend. Les colonnes d’origine sont conservées intégralement ; aucune restauration de sauvegarde fournisseur n’est prétendue testée. Ne pas lancer db push global : les anciennes migrations source et hébergées ont des versions distinctes, documentées dans les précédents sprints. Contrôles de production en lecture seule et vérification du déploiement READY.

Les anciennes PWA doivent actualiser pour enregistrer un bilan : le serveur bloque une requête sans expense_items pour éviter toute perte. Le mécanisme de mise à jour V1.3.1 est conservé. Réduire la fenêtre migration/frontend ; ne pas tester en saisissant le bilan d’un formateur réel.

## Retour arrière

Conserver toutes les colonnes et archives. Un retour au frontend V1.3.2 permet encore certaines lectures mais son enregistrement est intentionnellement bloqué. Ne jamais restaurer l’ancienne RPC qui pourrait écraser les totaux. Préférer un correctif compatible ou désactiver temporairement la saisie de bilan en conservant les données. Aucun rollback destructif automatique.

## Droits et diagnostics

Les nouveaux champs héritent de la table privée RLS owner_user_id=auth.uid ; aucun nouveau droit accordé. Recette locale PGlite et PostgreSQL hébergé réussies, OF/tiers refusés. Advisors sécurité recette inchangés avant/après : 23 informations no-policy, 2 search-path, 6 fonctions anonymes et 86 fonctions authentifiées historiques ; aucun constat nouveau sur activity_private/trainer_activity_private. Diagnostics historiques hors périmètre : https://supabase.com/docs/guides/database/database-linter .
