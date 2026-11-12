# Livraison et retour arrière — V1.3

État au 12 novembre 2026 : préparation ; **production non autorisée**. PR brouillon https://github.com/Macor77/clementplane/pull/21.

## Cibles vérifiées
- Source initiale main : 6bd565404d3c9f7a9b7ffa07eae85b5cbcd6d940, V1.2.4. Vercel production READY dpl_5ZMnNYVkHjufnW8RMNjgyFbVgey5.
- Production Supabase : hctvkynrgmnxjynbncdi (lecture seulement dans ce sprint).
- Recette Supabase : documentation-demo, jqhbrkyeawtsuzrzrnvm, branche non-default confirmée par list_branches ; environnement de recette préexistant (voir dossier Outlook). Son état global MIGRATIONS_FAILED est historique : aucun reset effectué. Seules les trois nouvelles migrations sont appliquées pour recette.

## Séquence après accord explicite
1. Vérifier le HEAD de main/PR et Quality, absence de nouveau conflit. Les variables Google/Outlook et leur pilote restent inchangées.
2. Relire l’historique Supabase de production et vérifier que les trois migrations n’ont pas déjà été appliquées sous un autre identifiant. Ne jamais lancer de db push global : les migrations historiques ont des identifiants divergents.
3. Appliquer une seule fois `20261112071707_trainer_activity_reports.sql` , `20261112073103_activity_privacy_notice.sql` puis `20261112074645_activity_validation_and_author.sql`. La première crée deux tables/RLS, un schéma privé et RPC. La seconde ajoute une version de notice à la compatibilité d’inscription. La troisième ajoute l’auteur conservé et contrôle les nombres avant arrondi. Aucune transformation de mission existante.
4. Vérifier tables, RLS, droits (pas d’écriture directe), signature invoker de l’API, search_path privé et absence d’exposition du schéma activity_private dans PostgREST. Enregistrer les identifiants distants et empreintes SQL.
5. Fusionner la PR validée. Vercel doit déployer le bon commit sur clementplane. Aucun nouveau secret/cron/fonction Edge ; aucune modification du pilote Outlook.
6. Contrôle en ligne non destructif : version V1.3.0, routes formateur/OF et chargement ; enregistrement réel uniquement sur compte fictif autorisé. Ne pas considérer la seule CI comme recette production.
7. Finaliser CLOSURE/RETOUR_PILOTAGE, tag v1.3.0 sur commit autorisé, archive exacte et SHA-256, release et téléchargement vérifié. Workflow de release préparé ; marqueur de commit uniquement après accord et contrôles.
8. Aucune communication sans autorisation distincte.

## Retour arrière et surveillance
Retour frontend au déploiement précédent : rend les nouveaux écrans indisponibles mais n’annule ni les données saisies ni la migration. Conserver les tables et les bilans ; ne pas supprimer de données pour rollback. La compatibilité de notice admet les anciens clients. Si besoin, suspendre les nouvelles écritures via révocation EXECUTE ciblée après diagnostic, puis restaurer la version corrigée ; ne pas modifier les fonctions calendriers.
Surveiller erreurs de chargement/sauvegarde et conflits de révision ; pas de contenu privé dans logs. Aucun coût externe additionnel par kilométrage ou bilan ; croissance stockage JSON bornée à 100 sessions × 100 dates et textes 5000 caractères. Les sources statistiques sont paginées et chargées à l’ouverture ; une agrégation serveur sera à envisager pour de très grands historiques.

## Migrations de recette effectivement appliquées

| Source Git | Nom distant | Version documentation-demo |
|---|---|---|
| 20261112071707_trainer_activity_reports.sql | trainer_activity_reports | 20261112073046 |
| 20261112073103_activity_privacy_notice.sql | activity_privacy_notice | 20261112073653 |
| 20261112074645_activity_validation_and_author.sql | activity_validation_and_author | 20261112074902 |

Les identifiants diffèrent car l’outil applique un horodatage serveur. Ne pas rejouer ces mêmes contenus sur cette base ; rechercher noms et contenu avant toute migration.
