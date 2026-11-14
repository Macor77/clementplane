# V1.3.2 — simplifier le bilan formateur

Mandat du 14 novembre 2026 : Vincent valide la proposition « une mission = une session = un groupe », intitulé non modifiable, retrait des effectifs/heures prévus, total réel en jours et heures sans conversion automatique. Base main a339c4a, V1.3.1 (correctifs PWA conservés). Préparation autorisée ; aucune nouvelle autorisation explicite de production ni de communication.

## Décisions d’implémentation
- Nouveau bilan simple : réalisation à renseigner/réalisée/partiellement réalisée/non réalisée, apprenants effectivement formés, jours et heures réels indépendants (0,5 jour possible), tarif/observations et données privées inchangés.
- Titre et dates de référence récupérés côté serveur à la création, actualisés avant la première réalisation si la mission reste accessible (reprogrammation). Les bilans déjà réalisés conservent leur référence. Aucun titre/date reçu du client pour le bilan simple. Le titre de la mission se modifie dans sa fiche selon les droits habituels, jamais dans le bilan.
- Pas de ventilation journalière inventée : les totaux simples sont rattachés à la première date de référence ; pour un ancien bilan à un groupe converti, première réalisation déjà déclarée. Règle visible dans les statistiques. Aucune division arbitraire par 7 h ou par le nombre de dates.
- À venir : missions/groupes confirmés et dates planifiées uniquement ; aucune demande ni affichage d’effectif ou d’heures prévisionnels. Propositions/options séparées.
- Conservation : les anciens détails ne sont jamais supprimés. Un ancien bilan à un groupe passe au formulaire simple au prochain enregistrement et son détail est conservé. Plusieurs anciens groupes restent distincts et corrigeables dans un écran historique, sans ajout/suppression de groupes. Ne pas fusionner leurs effectifs arbitrairement.
- Ancien client PWA : empêcher l’écrasement d’un bilan simple par une ancienne requête détaillée ; demander l’actualisation. Compatibilité en lecture explicitée, rollback frontend seul ne suffit pas à éditer le nouveau format.
- Confidentialité, RPC atomique, reprise idempotente, révisions, rattachement propriétaire/OF et absence d’envois/planning inchangés.

## Validation
Tests des types/bornes (fraction de jour, zéro/vide), intitulé/titre/format non falsifiables côté serveur, protection ancien client, conservation données historiques et absence de double comptage, années distinctes et futur. Parcours bureau/mobile, erreurs et retour d’onglet, OF lecture seule, privé non exposé. SQL de recette isolée uniquement ; aucune donnée réelle modifiée.
