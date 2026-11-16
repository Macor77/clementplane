# V1.6.0 — Décomptes séparés, 16 novembre 2026

Vincent remplace la décision « inclus dans le total » par deux saisies distinctes. Exemple : trois personnes ayant suivi toute la formation et une personne ayant suivi une heure donnent 3 entièrement formées, 1 partiellement formée et 4 participants. Une session reste un groupe. Le développement est autorisé ; la publication de cette nouvelle version attend une validation distincte de celle de V1.5.1.

## Contrat de données

Aucune migration. Le total persistant `report.summary.learner_count` et le contrat RPC restent inclusifs. `partial_attendance` conserve les effectifs et durées par personne. Dans le brouillon éditable seulement, `input.summary.learner_count` est exclusif : `activityDraft` soustrait les présences partielles, `validateActivity` les ajoute pour sérialiser. Ne jamais envoyer un brouillon directement à Supabase ni appeler deux fois cette conversion sur un même objet. Les fonctions sont pures, sans réécriture lors de la lecture.

Le total est calculé et non modifiable. Zéro entièrement formé est autorisé ; les partiels peuvent être plus nombreux. La somme reste limitée à 100 000. Les lignes vides sont ignorées ; une ligne partielle renseignée exige un effectif positif et au moins une durée positive. Une durée connue ne dépasse pas la durée animée de même unité. Les jours et heures sont indépendants ; une heure inconnue reste nulle, jamais convertie ni assimilée à zéro.

## Compatibilité

Un bilan simple ancien totalisant 4 dont 1 partiel s’ouvre à 3 entièrement formés. Sauvegarder une observation laisse le total stocké à 4, les durées et les données privées inchangées. Si des présences partielles n’ont pas été renseignées auparavant, le formateur doit les vérifier : le logiciel ne peut pas les deviner.

Les anciens bilans détaillés ne disposent pas d’une répartition fiable. Ils alimentent le total statistique historique, sans être qualifiés d’entièrement formés. Pour un ancien groupe unique, le champ complet reste vide et l’ancien effectif est affiché. Modifier seulement un autre champ préserve les sessions historiques. Modifier sa réalisation vers réalisé/partiel nécessite une saisie explicite du nouvel effectif complet ; passer à non réalisée/à renseigner reste possible sans effectif. Le RPC existant conserve les anciennes sessions lors de la conversion. Les anciens multi-groupes restent consultables et corrigibles comme avant.

## Affichage et statistiques

Intitulé explicite « Apprenants entièrement formés », aide contextuelle et volet partiel fermé par défaut. Total des participants calculé à part. La consultation OF expose les deux décomptes et le total, sans données privées. Mes statistiques distingue complet, partiel et total ; les effectifs historiques non répartis sont signalés dans le total. Périodes, jours/heures animés, sessions, activité future, frais et confidentialité restent inchangés.

## Limites BPF

Les durées par personne sont conservées pour un travail ultérieur. La notice officielle du BPF distingue les heures suivies par les stagiaires : https://travail-emploi.gouv.fr/sites/travail-emploi/files/files-spip/pdf/notice_bilan_pedagogique_et_financier.pdf (consultée le 16 novembre 2026). Par exemple 3 × 3,5 h + 1 × 1 h = 11,5 heures de présence cumulées, distinctes des 3,5 heures animées. Aucun export, calcul BPF ni conformité réglementaire automatique n’est livré ici. Les heures inconnues et les sessions à cheval sur une période devront être traitées dans ce futur périmètre.

## Validation prévue

Tests unitaires des conversions, cas zéro/inconnu/anciens bilans/périodes ; PostgreSQL PGlite du contrat inclusif et des permissions existantes ; navigateur ordinateur/mobile sur données fictives avec sauvegarde, rechargement, statistiques et lecture OF. Revue indépendante, CI Quality, archive candidate avant demande de publication.
