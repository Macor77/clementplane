# Retour pilotage — V1.2.3

Livré et clôturé le 22 octobre 2026. L'OF est désormais notifié après acceptation ou refus depuis les deux parcours, grâce à une file transactionnelle et un traitement serveur chaque minute. Les erreurs récupérables font l'objet de reprises bornées ; les résultats fournisseur incertains sont réconciliés avant tout renvoi.

PR #15 fusionnée, version 1.2.3 en production, CI PR/main réussies (245 tests et 18 tests navigateur), migration ciblée, worker v14 et cron contrôlés. Dry-run de production réussi sans envoi. Tag et release v1.2.3 publiés, archive des sources téléchargée et vérifiée par le workflow. Preuves et limites : CLOSURE.md.

Pas de nouveau parcours utilisateur, pas de mail de nouveauté. Les anciennes réponses ne sont pas rejouées. Suivi opérationnel : surveiller failed/uncertain et l'âge des pending ; confirmer l'acheminement lors d'une prochaine réponse réelle. La recette n'a pas sollicité de destinataire réel.

La revue technique légale ne demande pas de modification des textes publics ; registre, conservation et procédure de droits actualisés. Les réserves historiques Google Agenda restent inchangées.

Prochaine priorité : reprendre la priorisation de l'utilité quotidienne formateur prévue dans la roadmap, sans démarrer de nouveau sprint ici.
