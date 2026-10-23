# Exploitation

Appliquer uniquement la migration manual_mission_revalidation après contrôle des historiques ; ne pas faire de db push global. Les anciennes fonctions publiques restent inchangées et refusent les réponses déjà traitées. La confirmation OF n’envoie aucun e-mail et ne modifie pas mission_formateurs ; la queue de notifications d’acceptation initiale n’est donc pas déclenchée. Les triggers Google existants observent la résolution.

Rollback : revenir au frontend précédent puis révoquer EXECUTE de la nouvelle RPC pour authenticated si nécessaire. Ne pas effacer les accords/historiques enregistrés. Les demandes anciennes restent compatibles.

Surveillance : erreurs RPC, conflits concurrentiels, demandes non rechargées. Après un timeout, recharger avant de réessayer ; une réponse enregistrée ne peut être remplacée. Le formulaire ne prétend pas sauvegarder hors connexion.

## Livraison du 23 octobre 2026
Migration source `20261023094201_manual_mission_revalidation.sql`, appliquée par MCP sous version distante `20261023100710` / nom `manual_mission_revalidation`. Même corps SQL vérifié (MD5 prosrc : 745c3104a5ba13cf7f86e524245f23b6). Ne pas rejouer le fichier source pour tenter d’aligner les timestamps. Aucun db push global.

Contrôle production : EXECUTE anon=false, authenticated=true ; search_path vide ; appel sans identité rejeté AUTH_REQUIRED. L’avis Supabase sur RPC SECURITY DEFINER authentifiée est intentionnel : les tables métier ont RLS sans accès direct, la RPC contrôle l’adhésion active à l’OF. Autres avis préexistants inchangés, notamment pg_net en public.
