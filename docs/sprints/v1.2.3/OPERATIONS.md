# Exploitation — V1.2.3

Le scheduler `clementplane-mission-responses` appelle `notify-mission-response` toutes les minutes. L'authentification réutilise la clé serveur de worker déjà gérée dans Vault `calendar_worker_secret` et Edge `CALENDAR_WORKER_SECRET`, sans la copier en clair. La rotation de cette clé concerne donc les deux workers. L'URL est dérivée du secret existant `calendar_worker_url`. Ne pas exposer le schéma net ni donner LOGIN aux rôles client. Aucun secret/token/corps de mail dans les traces.

## Surveillance
```sql
select status,count(*),min(created_at) from public.mission_response_outbox group by status;
select id,status,attempts,last_error,created_at from public.mission_response_outbox
where status in ('failed','uncertain') or (status='pending' and created_at<now()-interval '1 hour');
```
Le statut outbox `sent` signifie accepté par Brevo (ou preuve webhook), pas lecture par le destinataire. `email_logs` conserve les événements de livraison. Un échec définitif d'acheminement après acceptation Brevo ne doit pas provoquer de répétition automatique.

`uncertain` : consulter email_logs (id égal à celui du job) et les événements Brevo ; si une preuve d'envoi apparaît, le worker réconcilie. Ne remettre en pending qu'après preuve de non-envoi, jamais sur simple absence de webhook. `failed` : corriger la cause puis reprise opérateur ciblée. Les erreurs de préparation sont volontairement génériques pour ne pas journaliser de données personnelles.

Lease de 5 minutes ; une préparation interrompue est récupérable, un appel fournisseur interrompu devient uncertain. Débit maximum 10 jobs par invocation, budget 25 secondes de boucle, timeout HTTP 15 secondes ; aucune dépense ou souscription supplémentaire configurée. Purge opportuniste des jobs terminaux >30 jours à chaque claim ; une panne du cron retarde cette purge.

Dry-run réservé au secret serveur : POST {dryRun:true,relationId:<relation déjà acceptée/refusée>} prépare le contenu et résout le destinataire sans envoyer, sans modifier la mission et sans retourner de données personnelles. Les appels publics hérités sont sans effet et ne peuvent pas envoyer de mail.

Pause : `select cron.unschedule('clementplane-mission-responses');`. Restaurer ensuite avec le script operations après vérification d'absence de doublon. Ne jamais purger une file active pour résoudre une erreur.
