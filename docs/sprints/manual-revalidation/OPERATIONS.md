# Exploitation

Appliquer uniquement la migration manual_mission_revalidation après contrôle des historiques ; ne pas faire de db push global. Les anciennes fonctions publiques restent inchangées et refusent les réponses déjà traitées. La confirmation OF n’envoie aucun e-mail et ne modifie pas mission_formateurs ; la queue de notifications d’acceptation initiale n’est donc pas déclenchée. Les triggers Google existants observent la résolution.

Rollback : revenir au frontend précédent puis révoquer EXECUTE de la nouvelle RPC pour authenticated si nécessaire. Ne pas effacer les accords/historiques enregistrés. Les demandes anciennes restent compatibles.

Surveillance : erreurs RPC, conflits concurrentiels, demandes non rechargées. Après un timeout, recharger avant de réessayer ; une réponse enregistrée ne peut être remplacée. Le formulaire ne prétend pas sauvegarder hors connexion.
