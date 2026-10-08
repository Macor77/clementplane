# V1.2 — État de la recette

Recette réelle sur données métier fictives et compte Google propriétaire autorisé. Accès limité aux testeurs ; sprint non clôturé.

Une vérification serveur signifie que le moteur déployé a traité la vraie API Google, terminé sans erreur et enregistré les correspondances attendues. Elle ne prouve pas, à elle seule, les descriptions ou les droits de consultation Google.

| Critère | État vérifié | Limite restante |
| --- | --- | --- |
| OAuth | Connexion réelle réussie ; callback PWA corrigé et vérifié avec service worker actif | Refus, déconnexion et reconnexion réels à terminer |
| Import et doublons | Trois journées personnelles initiales ; identifiant stable lors des mises à jour et après perte simulée de la correspondance serveur | Suppression manuelle dans Google à contrôler |
| Proposition → option → confirmation | Trois états traités par le moteur réel ; identifiant Google inchangé | Intitulés et disponibilité de chaque état à inspecter |
| Missions personnelles | Création et annulation par l’interface ; modification, ajout/retrait de journées et annulation synchronisés | Descriptions distantes détaillées à inspecter |
| Refus, désistement, désaffectation, annulation OF et retrait | Événements concernés supprimés par le moteur réel | Parcours OF complets couverts par la non-régression, pas intégralement rejoués dans cette recette |
| Expiration | Proposition exportée avant échéance puis retirée par le cycle périodique, sans nouvelle mutation ni relance client | Vérification serveur ; contenu détaillé Google non inspecté |
| Multidates, horaires, journée entière, changement d'heure | Trois journées visibles dans Google ; horaires locaux corrects avant/après le changement d'heure | Appareil mobile réel à terminer |
| Revalidation | Ancienne journée conservée en attente ; nouvelle journée synchronisée après acceptation via le RPC métier du formateur | Avertissement et description Google détaillés à inspecter |
| Erreurs, quotas, simultanéité | Tests automatisés des erreurs fournisseur, verrous et reprises | Pas d'incident Google réel provoqué |
| Application fermée | Mutation serveur synchronisée après fermeture de l'onglet de recette, sans relance depuis cet onglet | Inventaire complet des autres onglets indisponible ; ne pas assimiler à une fermeture de tout le navigateur |
| Partages Google | Événements privés et règles couverts automatiquement et documentés | Comptes de consultation distincts à désigner et autoriser ; aucun partage automatique |
| Invités et notifications | Payload sans invités, rappels désactivés et sendUpdates=none vérifiés automatiquement | Inspection Google réelle à terminer |
| Rémunération et notes | Activation puis désactivation par l'interface ; cycles réels terminés ; réglages finaux désactivés | Retrait des champs dans le contenu distant non inspecté |
| Isolation et événements externes | Mission d'un autre formateur et sélection interne exclues du moteur réel | Événement ajouté manuellement dans Google à vérifier |
| Non-régression | 211 tests et CI applicative réussis : SQL/RLS, audit, compilation, scénario PWA | Relancer après correction applicative |
| Desktop, mobile et PWA | Interface desktop/mobile simulée, callback avec service worker, connexion desktop réelle | PWA sur appareil réel à terminer |

## Blocage et protocole restant

Le navigateur refuse l'observation détaillée d'un événement Google après ouverture. Les états serveur et la vue du calendrier fournissent des preuves partielles ; aucun contournement ni extraction de session ou jeton n'est utilisé.

Reprendre les contrôles détaillés lorsque l'inspection sera possible. Tester freeBusyReader, reader, writer et owner avec des comptes Google distincts autorisés, sans vrai partenaire ni invité. Captures publiques : interface réelle et données entièrement fictives. Les relevés précis et identifiants de fixtures restent dans le rapport privé.
