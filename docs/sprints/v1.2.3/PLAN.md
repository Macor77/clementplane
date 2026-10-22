# V1.2.3 — Notifications de réponse aux propositions

Mandat du 22 octobre 2026 : diagnostic puis validation par Vincent (« OK. Vas-y. ») du correctif serveur, reprises et absence de doublons. Aucun e-mail de nouveauté ni sollicitation partenaire. Ne pas rejouer les réponses historiques.

## Besoin et conception retenue
Les RPC public et connecté enregistrent la réponse mais seul le navigateur public appelait la notification. Une outbox transactionnelle sur mission_formateurs couvre les deux parcours sans modifier leurs signatures, droits ou règle « accepter puis affecter ».

- Un travail unique par relation/statut/horodatage ; réponse et travail validés/annulés ensemble.
- Worker chaque minute, claim exclusif SKIP LOCKED, verrou à durée limitée, jeton de verrou pour exclure les anciens workers.
- Modèle de mail et choix du propriétaire OF préservés, alternative texte ajoutée.
- Six tentatives maximum pour préparation et rejet explicite HTTP 429, délais 1/5/15/60/240 minutes. Erreurs définitives arrêtées.
- Avant l'appel Brevo : état durable sending. Timeout, HTTP 5xx ou réponse illisible : uncertain, pas de renvoi aveugle. Réconciliation automatique à partir du webhook ; sinon vérification opérateur. La protection ne repose pas sur une promesse d'idempotence externe.
- Reprise des anciens clients : endpoint historique compatible mais n'envoie plus. Un mail enregistré par l'ancienne version pour la même réponse est détecté avant envoi.
- Données techniques invisibles aux rôles navigateur, purge après 30 jours des états terminaux et cascade à la suppression de relation. Pas de nouveau prestataire.

## Validation
Tests PostgreSQL embarqué avec les deux RPC réelles × accepter/refuser ; transaction annulée, unicité, droits, concurrence logique, verrous expirés, plafond de reprises et réconciliation. Tests worker avec transport simulé ; rendu et destinataire. Quality complète, lint, audit, build et tests navigateur du dépôt. Contrôle serveur déployé en dry-run authentifié sans e-mail.

## Livraison et retour arrière
Appliquer uniquement la nouvelle migration, déployer notify-mission-response puis installer la tâche planifiée. Pas de db push global : des migrations historiques portent des identifiants distants différents déjà documentés. Contrôler les éventuels travaux créés pendant la transition ; le garde legacy évite un double envoi. Frontend et version V1.2.3 via PR/main et Vercel. Retour arrière : désactiver la tâche cron ; conserver l'outbox et le worker compatible jusqu'à réconciliation. Restaurer seulement l'ancien endpoint pourrait perdre les réponses connectées et nécessite un audit des jobs en attente.
