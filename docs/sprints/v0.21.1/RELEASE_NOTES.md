# Clementplane v0.21.1 — Votre agenda professionnel, même sans OF inscrit

Brouillon — ne pas publier comme livraison déployée avant les gates de CLOSURE.md.

Les formateurs peuvent ajouter leurs propres interventions, avec plusieurs dates et des informations privées, puis les modifier ou les annuler. Elles rejoignent Mes missions, Mon planning et la prochaine mission de l’accueil.

Les disponibilités partagées restent cohérentes à la journée. Les organismes voient seulement une indisponibilité neutre, jamais le client, le titre, les notes ou la rémunération. Aucun contact n’est averti automatiquement.

Les compteurs distinguent désormais une mission de ses différentes dates. Des avertissements signalent les chevauchements sans empêcher la saisie.

Cette version ne synchronise pas encore Google/Outlook/Apple et ne gère ni BPF, ni facturation, ni réalisation/paiement.

Installation après accord de production : appliquer dans cet ordre `20261005113329_personal_trainer_missions.sql` puis `20261005135703_personal_missions_privacy_version_compatibility.sql`, avant de déployer le frontend. La seconde conserve les inscriptions des clients en cache et accepte la nouvelle notice, en enregistrant la version réellement reconnue. Ne pas lancer toutes les migrations aveuglément : tutorial_analytics était absente de l’historique distant à l’audit.
