# V1.2 — État de la recette

Recette réelle sur données métier fictives et compte Google propriétaire autorisé. Accès limité aux testeurs ; sprint non clôturé.

Une vérification serveur signifie que le moteur déployé a traité la vraie API Google, terminé sans erreur et enregistré les correspondances attendues. Elle ne prouve pas, à elle seule, les descriptions ou les droits de consultation Google. Les événements réels ont ensuite été inspectés côté propriétaire, puis le 9 octobre 2026 dans deux sessions Google distinctes disposant de droits de lecture différents.

| Critère | État vérifié | Limite restante |
| --- | --- | --- |
| OAuth | Connexion réelle réussie ; callback PWA corrigé et vérifié avec service worker actif | Refus, déconnexion et reconnexion réels à terminer |
| Import et doublons | Identifiant stable lors des mises à jour et après perte simulée de correspondance ; événement supprimé dans Google recréé avec une nouvelle génération ; trois événements attendus sans doublon sur la fenêtre finale | Contrôle limité à la fenêtre de recette inspectée |
| Proposition → option → confirmation | Intitulés réels et identifiant stable vérifiés ; propositions/options disponibles, confirmation occupée. Chez les deux lecteurs, propositions/options absentes, confirmation réduite à « occupé » ; restauration vérifiée après rechargement | Observation limitée aux comptes, créneaux et vues de recette |
| Missions personnelles | Création et annulation par l’interface ; modifications et suppressions synchronisées ; description réelle et lien personnel inspectés | Appareil PWA réel à terminer |
| Refus, désistement, désaffectation, annulation OF et retrait | Événements concernés supprimés par le moteur réel | Parcours OF complets couverts par la non-régression, pas intégralement rejoués dans cette recette |
| Expiration | Proposition exportée avant échéance puis retirée par le cycle périodique, sans nouvelle mutation ni relance client ; absente de la recherche Google finale | Retrait initial observé côté serveur |
| Multidates, horaires, journée entière, changement d'heure | Trois journées visibles dans Google ; horaires locaux corrects avant/après le changement d'heure | Appareil mobile réel à terminer |
| Revalidation | Avertissement et anciennes conditions inspectés dans Google en attente ; nouveau créneau absent avant acceptation, puis présent sans ancien événement ni avertissement après acceptation via le RPC métier du formateur | Parcours d’acceptation exercé par RPC authentifié sur fixture |
| Erreurs, quotas, simultanéité | Tests automatisés des erreurs fournisseur, verrous et reprises | Pas d'incident Google réel provoqué |
| Application fermée | Mutation serveur synchronisée après fermeture de l'onglet de recette, sans relance depuis cet onglet | Inventaire complet des autres onglets indisponible ; ne pas assimiler à une fermeture de tout le navigateur |
| Partages Google | Comptes distincts en disponibilités uniquement et en lecture des détails : titres et détails métier privés masqués ; créneaux confirmés « occupé » ; fiches OF et personnelle inspectées | Droit d’édition non testé : options grisées dans le partage. Restriction d’organisation probable, non inspectée dans la console administrateur ; aucune permission modifiée automatiquement |
| Invités et notifications | Aucun invité ni rappel sur les événements Clementplane inspectés ; sendUpdates=none vérifié automatiquement. Aucun rappel configuré et cinq notifications e-mail sur « Aucune » chez le second lecteur | Boîtes mail non consultées ; aucune affirmation de contrôle des messages reçus |
| Rémunération et notes | Parcours de réglage testé par l’interface ; ajout puis retrait des tarifs et notes vérifiés dans les descriptions Google réelles ; réglages finaux désactivés | Le cycle de preuve distante a utilisé des réglages de recette côté serveur |
| Isolation et événements externes | Mission d’un autre formateur et sélection interne exclues ; événement témoin créé directement dans Google préservé pendant les cycles | Le témoin est indépendant des événements gérés par Clementplane |
| Non-régression | 211 tests et CI applicative réussis : SQL/RLS, audit, compilation, scénario PWA | Relancer après correction applicative |
| Desktop, mobile et PWA | Interface desktop/mobile simulée, callback avec service worker, connexion desktop réelle | PWA sur appareil réel à terminer |

## Blocage et protocole restant

Le propriétaire a été inspecté via Google Calendar et les deux lecteurs via leurs interfaces réelles. Les comptes ont été identifiés et leurs droits vérifiés dans Google avant les essais. Le fuseau des lecteurs diffère de celui des missions ; les correspondances horaires ont été contrôlées sans changer leurs paramètres. Les transitions de recette ont été réalisées sur une seule fixture, puis son statut et ses horodatages initiaux ont été restaurés. Synchronisation active, sans erreur, contrôlée de nouveau le 9 octobre.

Le titulaire a fourni une capture montrant les droits d’édition indisponibles pour le compte externe. Conserver les réglages de l’organisation. Ce cas reste non testé ; la documentation Google distingue une édition limitée, conservant le masquage des événements privés, et une édition avec accès aux détails. Le résultat des lecteurs ne permet pas de conclure pour ces droits avancés. Voir [les permissions Google](https://support.google.com/calendar/answer/15716974?hl=fr) et [les limites Workspace](https://knowledge.workspace.google.com/admin/calendar/set-google-calendar-sharing-options?hl=fr).

Refus/déconnexion/reconnexion réels et PWA sur appareil réel restent à terminer. La session Clementplane de recette demande une nouvelle authentification : aucune déconnexion Google n’a été lancée pendant cette reprise. Captures publiques : interface réelle et données entièrement fictives. Les relevés précis et identifiants de fixtures restent dans le rapport privé.
