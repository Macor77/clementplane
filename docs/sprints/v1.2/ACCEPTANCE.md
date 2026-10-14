# V1.2 — État de la recette

Recette réelle sur données métier fictives et compte Google propriétaire autorisé. Accès limité aux testeurs ; sprint non clôturé.

Une vérification serveur signifie que le moteur déployé a traité la vraie API Google, terminé sans erreur et enregistré les correspondances attendues. Elle ne prouve pas, à elle seule, les descriptions ou les droits de consultation Google. Les événements réels ont ensuite été inspectés côté propriétaire, puis le 9 octobre 2026 dans deux sessions Google distinctes disposant de droits de lecture différents.

| Critère | État vérifié | Limite restante |
| --- | --- | --- |
| OAuth | Connexion, déconnexion et reconnexion réelles du même compte réussies ; jeton serveur supprimé à la déconnexion ; calendrier et trois identifiants d’événements conservés après reprise. Callback PWA vérifié avec service worker actif | Refus avant expiration et retour expiré rejetés sans réactivation ; reconnexion finale réussie. Appareil PWA réel à terminer |
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

Déconnexion/reconnexion exécutées le 9 octobre dans l’interface avec le même propriétaire. Après déconnexion, état serveur déconnecté, jeton absent et trois événements conservés dans Google. Après reconnexion, cycle serveur terminé sans erreur, même calendrier, mêmes trois événements et aucune duplication dans la fenêtre contrôlée. Rémunération et notes restent désactivées. Aucune donnée métier ni permission de partage modifiée pendant ce contrôle.

Le clic Annuler chez Google a eu lieu après les dix minutes de validité de l’intention. Le callback a rejeté ce retour, sans réactivation ; le statut déconnecté est réapparu au rafraîchissement périodique. Un second essai avant expiration a ensuite affiché le message explicite de refus ; état déconnecté et jeton absent confirmés. La reconnexion finale a terminé un nouveau cycle sur les mêmes trois événements. Le refus avant expiration est donc validé séparément. La PWA sur appareil réel reste à terminer. Les vérifications de configuration et limites d’accès sont détaillées dans [PUBLICATION_READINESS.md](PUBLICATION_READINESS.md). Captures publiques : interface réelle et données entièrement fictives. Les relevés précis et identifiants de fixtures restent dans le rapport privé.


## Complément du 12 octobre 2026 — nom et invitation

- Nouveau calendrier dédié : « Prénom Nom — Clementplane », issu du profil du compte, avec repli sur l’identité formateur puis « Clementplane » si aucune identité n’est renseignée.
- Au prochain cycle du worker mis à jour, un calendrier existant encore nommé exactement « Clementplane » est renommé sur le même identifiant. Aucun événement ni partage n’est recréé. Les noms personnalisés dans Google sont conservés ; les modifications ultérieures du profil ne remplacent pas ces noms.
- Invitation non bloquante dans l’espace formateur dès qu’une mission personnelle ou une proposition acceptée/confirmée existe. Les propositions sans réponse ne déclenchent pas l’invitation. Une acceptation déclenche la vérification sans quitter la page.
- « Connecter Google Agenda » ouvre les réglages Google ; « Plus tard » masque l’invitation pour ce compte sur ce navigateur, y compris après rechargement. Le refus n’est pas synchronisé entre appareils. La connexion reste disponible dans Paramètres. Aucun démarrage OAuth automatique.
- Invitation masquée lorsque le compte est déjà connecté ou que la fonctionnalité est désactivée pour ce compte. L’indisponibilité de la vérification ne bloque pas les missions.
- 216 tests Vitest réussis, compilation réussie ; lint sans erreur, deux avertissements historiques conservés. 8 parcours Playwright réussis (ordinateur 1440 px, mobile 390 px, acceptation sans navigation, masquage persistant, compte connecté et callback PWA). Les vérifications navigateur utilisent une API simulée, pas une nouvelle autorisation Google réelle.

### Retour Android du 9 octobre

Captures fournies par le titulaire : reconnexion du même compte depuis le navigateur Android (Samsung Internet probable, selon son retour), retour à Clementplane puis dernière synchronisation réussie à 16:36:06 affichée ; rémunération et notes désactivées. Le titulaire confirme que la connexion reste présente après réouverture. Le parcours depuis une PWA réellement installée n’a pas été réalisé : cette réserve demeure. Ce retour n’ajoute pas de preuve serveur des identifiants d’événements pendant le cycle mobile.

Le test SQL local valide les droits de lecture limités aux colonnes d’identité pour service_role, sans lecture de l’e-mail du profil ni écriture ni élargissement des accès navigateur. La migration et le déploiement Edge en recette sont bloqués par le contrôle automatique en attente d’un accord ciblé ; le renommage Google réel n’est pas encore validé.

### Activation de recette autorisée le 12 octobre

Accord explicite du titulaire reçu pour la migration de lecture des colonnes d’identité et le déploiement des deux fonctions dans documentation-demo uniquement. Migration appliquée ; droits de lecture confirmés ; fonctions google-calendar et google-calendar-worker actives en version 5. Un cycle réel du nouveau worker a terminé sans erreur le 12 octobre à 05:05:05 UTC (07:05:05 à Paris). Ce cycle inclut le contrôle du nom et le renommage du calendrier générique si nécessaire ; le titre affiché dans Google n’a pas été relu directement dans une session propriétaire pendant cette reprise.

Les 11 parcours navigateur de la CI sont réussis localement : PWA, missions personnelles ordinateur/mobile, réglages et invitation Google. Le compteur du test de mission personnelle distingue maintenant la lecture de statut Google des appels d’envoi : il continue d’interdire tout envoi et toute action OAuth automatique. La CI précédente avait échoué sur cette confusion de compteur, malgré des tests applicatifs, SQL, audit et compilation réussis.

### Confirmation visuelle propriétaire — 12 octobre 07:09 (Paris)

Capture fournie par le titulaire : le calendrier Google affiche dans son infobulle « Vincent Recette v0.21.1 — Clementplane ». Le renommage du calendrier de recette est donc confirmé visuellement. CI Quality run 87 entièrement réussie sur dd1d858a918b51930fdd019eb98b58962ba48266, dont tests applicatifs, SQL/RLS, audit, compilation et 11 parcours navigateur. Les réserves PWA installée, droits avancés, configuration Google de production et journaux demeurent.
