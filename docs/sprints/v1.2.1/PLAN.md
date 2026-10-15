# V1.2.1 — Fiabilité des disponibilités

Mandat du 15 octobre 2026 : réaliser les corrections réseau/session proposées après un signalement utilisateur. Sprint correctif distinct de V1.2. Aucune sollicitation des formateurs ni campagne e-mail.

## Résultat attendu
- Afficher une sauvegarde réussie uniquement après confirmation serveur ; conserver l'ancien statut pendant l'attente.
- Refuser une réponse vide à une mutation ; expliquer les résultats incertains après panne réseau sans rejouer automatiquement l'écriture.
- Vérifier la session et renouveler de façon bornée après rejet 401 ; préserver les permissions (403 non contourné).
- Montrer une erreur de chargement plutôt qu'un calendrier interprétable comme vide, offrir une reprise et recharger au retour réseau.
- Valider desktop/mobile avec API simulée, non-régression et compilation.

## Périmètre
Page Mes disponibilités et appels RPC associés. Aucun changement de schéma, permissions, données métier ou Google Agenda. Pas de synchronisation hors connexion ni de file persistante d'écritures. Retour arrière : restaurer le frontend précédent.

## Diagnostic
Les journaux du 14 octobre montrent des rejets 401 sur lecture et mutation depuis Safari aux horaires du signalement. Les anciennes données existent. La cause précise de la perte d'authentification dans ce navigateur reste non reproduite. Le code affichait optimistement une modification avant la réponse serveur ; sa tentative de relecture après échec pouvait échouer aussi. Ces défauts d'interface sont vérifiables indépendamment de la cause initiale.

## Validation
Tests service : confirmation vide, session manquante, renouvellement 401, pas de rejeu réseau, refus 403. Tests navigateur : chargement interrompu, reprise manuelle, attente serveur, confirmation, échec mutation, reprise réseau, 401, formats 1440/390 px. Les API sont simulées, pas de saisie dans le compte du signalant.
