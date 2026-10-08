# V1.2 — État de la recette

Recette réelle sur données métier fictives et compte Google propriétaire autorisé. Accès limité aux testeurs ; sprint non clôturé.

Une vérification serveur signifie que le moteur déployé a traité la vraie API Google, terminé sans erreur et enregistré les correspondances attendues. Elle ne prouve pas, à elle seule, les descriptions ou les droits de consultation Google. Une seconde étape a inspecté les événements réels via Google Calendar avec le compte propriétaire ; ces lectures ne remplacent pas les contrôles avec les comptes lecteurs.

| Critère | État vérifié | Limite restante |
| --- | --- | --- |
| OAuth | Connexion réelle réussie ; callback PWA corrigé et vérifié avec service worker actif | Refus, déconnexion et reconnexion réels à terminer |
| Import et doublons | Identifiant stable lors des mises à jour et après perte simulée de correspondance ; événement supprimé dans Google recréé avec une nouvelle génération ; trois événements attendus sans doublon sur la fenêtre finale | Contrôle limité à la fenêtre de recette inspectée |
| Proposition → option → confirmation | Intitulés réels et identifiant stable vérifiés ; propositions/options disponibles, confirmation occupée, y compris dans la réponse free/busy Google | Lecture par comptes distincts à qualifier |
| Missions personnelles | Création et annulation par l’interface ; modifications et suppressions synchronisées ; description réelle et lien personnel inspectés | Appareil PWA réel à terminer |
| Refus, désistement, désaffectation, annulation OF et retrait | Événements concernés supprimés par le moteur réel | Parcours OF complets couverts par la non-régression, pas intégralement rejoués dans cette recette |
| Expiration | Proposition exportée avant échéance puis retirée par le cycle périodique, sans nouvelle mutation ni relance client ; absente de la recherche Google finale | Retrait initial observé côté serveur |
| Multidates, horaires, journée entière, changement d'heure | Trois journées visibles dans Google ; horaires locaux corrects avant/après le changement d'heure | Appareil mobile réel à terminer |
| Revalidation | Avertissement et anciennes conditions inspectés dans Google en attente ; nouveau créneau absent avant acceptation, puis présent sans ancien événement ni avertissement après acceptation via le RPC métier du formateur | Parcours d’acceptation exercé par RPC authentifié sur fixture |
| Erreurs, quotas, simultanéité | Tests automatisés des erreurs fournisseur, verrous et reprises | Pas d'incident Google réel provoqué |
| Application fermée | Mutation serveur synchronisée après fermeture de l'onglet de recette, sans relance depuis cet onglet | Inventaire complet des autres onglets indisponible ; ne pas assimiler à une fermeture de tout le navigateur |
| Partages Google | Propriété privé vérifiée sur les événements réels avec le compte propriétaire ; deux comptes lecteurs désignés par le titulaire | Accès freeBusyReader, reader et writer à vérifier ; aucun partage automatique |
| Invités et notifications | Aucun invité ni rappel sur les événements Clementplane inspectés ; sendUpdates=none vérifié automatiquement | Boîtes mail non consultées ; aucune affirmation de contrôle des messages reçus |
| Rémunération et notes | Parcours de réglage testé par l’interface ; ajout puis retrait des tarifs et notes vérifiés dans les descriptions Google réelles ; réglages finaux désactivés | Le cycle de preuve distante a utilisé des réglages de recette côté serveur |
| Isolation et événements externes | Mission d’un autre formateur et sélection interne exclues ; événement témoin créé directement dans Google préservé pendant les cycles | Le témoin est indépendant des événements gérés par Clementplane |
| Non-régression | 211 tests et CI applicative réussis : SQL/RLS, audit, compilation, scénario PWA | Relancer après correction applicative |
| Desktop, mobile et PWA | Interface desktop/mobile simulée, callback avec service worker, connexion desktop réelle | PWA sur appareil réel à terminer |

## Blocage et protocole restant

Le navigateur reste limité pour l’inspection détaillée Google. L’intégration Google Calendar a permis de vérifier les propriétés, descriptions, invités, rappels et disponibilités des événements réels du seul calendrier de recette. Aucun jeton ni session n’a été extrait. Le rendu chez les lecteurs distincts reste à qualifier.

Le compte owner a été inspecté. Tester désormais freeBusyReader, reader et writer avec les comptes Google distincts autorisés, sans vrai partenaire ni invité d’événement. Captures publiques : interface réelle et données entièrement fictives. Les relevés précis et identifiants de fixtures restent dans le rapport privé.
