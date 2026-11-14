# V1.3.2 — bilan de préparation

**Développement et recette terminés. Prêt pour autorisation de publication. Non publié en production.** Mandat du 14 novembre 2026, base V1.3.1 `a339c4a`. La nouvelle version conserve les corrections d’installation PWA.

## Résultat préparé
Un seul groupe par mission. Intitulé non modifiable dans le bilan, retrait des effectifs et heures prévus, apprenants effectivement formés et durée réelle totale en jours et heures (dont 0,5 jour). Les champs financiers et privés gardent leurs règles d’accès.

## Matrice de livraison
| Volet | État / preuve |
|---|---|
| Conception | DESIGN.md, périmètre validé par Vincent |
| Développement | Formulaire, service, statistiques, migration additive ; revue et contre-revue sans blocage |
| Tests | 367 unitaires, 49 parcours navigateur, SQL/RLS locaux et PostgreSQL hébergé réussis ; captures bureau/mobile relues, voir ACCEPTANCE.md |
| Historique | Détail conservé ; conversion explicite à l’enregistrement pour un groupe ; plusieurs anciens groupes corrigeables sans fusion |
| Documentation | GUIDE, OPERATIONS, FAQ et parcours Découvrir ; roadmap et changelog |
| Juridique / RGPD | Même finalité, mêmes destinataires et droits. Ajout de jours réels agrégés à la durée déjà déclarée ; aucune identité d’apprenant, nouvelle communication ou nouveau tiers. Notice 2026-11-12 applicable, pas de nouvelle acceptation requise |
| Production | Non autorisée pour cette nouvelle version ; aucune migration ni fusion main |
| Version / release | 1.3.2 candidate ; tag et release après publication autorisée |
| Archive | Candidate construite, téléchargée et intégrité vérifiée ; nouvelle archive automatique sur le dernier commit documentaire, pas une archive de production |
| Communication | Aucun e-mail ni notification envoyé ; aucun envoi prévu |

## Limites
Les totaux simplifiés sont rattachés à une seule date, sans inventer de ventilation sur plusieurs années. Les anciens bilans gardent leur logique détaillée jusqu’à conversion ; les anciens bilans à plusieurs groupes ne sont pas fusionnés. Le pilote Outlook reste hors périmètre.
