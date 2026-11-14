# Clôture — V1.3.2

**Application livrée en production le 14 novembre 2026 après autorisation explicite de Vincent.** PR [#23](https://github.com/Macor77/clementplane/pull/23), commit applicatif a611276b, Vercel READY. La clôture finale est matérialisée par le tag, la release et la réussite du workflow de publication référencés ci-dessous.

## Résultat
Un groupe par mission, intitulé verrouillé dans le bilan, apprenants effectivement formés et totaux réels en jours/heures. Suppression des champs prévisionnels et des commandes d’ajout de groupes. Les anciens détails sont conservés ; les groupes historiques ne sont pas fusionnés. Les droits privé/OF et le planning restent inchangés.

| Obligation | Résultat / preuve |
|---|---|
| Périmètre et développement | Exigences validées livrées ; DESIGN, PR #23 |
| Recette et revue | 367 unitaires, 49 parcours navigateur, SQL/RLS locaux et PostgreSQL hébergé ; revue/contre-revue sans blocage ; ACCEPTANCE |
| Production | Migration unique appliquée, fonctions conformes à la recette, ancien détail intact, RLS et refus API vérifiés ; PRODUCTION |
| Documentation | README, architecture/base/tests/dépannage/décisions, guide et opérations actualisés |
| Impact légal | Chaque texte et procédure examiné selon LEGAL_REVIEW ; registre complété, notice 2026-11-12 maintenue |
| Roadmap et changelog | Racine et docs synchronisés ; nouvelle règle remplace le choix multi-groupe pour les nouveaux bilans |
| Découvrir / évolutions / landing | FAQ, parcours formateur/OF et promesse de présentation actualisés ; pistes statistiques/BPF conservées ; anciens PDF de parcours inchangés, captures de recette fictives relues |
| Version et GitHub | 1.3.2 technique et affichée, code intégré, publication autorisée |
| Tag / release / archive | Chaîne Quality → Release V1.3.2 sur le commit de clôture exact ; archive sans secrets/caches, manifestes et téléchargement vérifiés par le workflow |
| Communication | Pas de campagne dédiée, information dans l’application suffisante pour ce correctif ; aucun envoi, voir COMMUNICATION |
| Pilotage | RETOUR_PILOTAGE : observer la complétude, aucun nouveau sprint lancé |

[Release v1.3.2](https://github.com/Macor77/clementplane/releases/tag/v1.3.2) · [Publication et archive vérifiée](https://github.com/Macor77/clementplane/actions/workflows/release-v1.3.2.yml)

## Limites explicites
Tests navigateur avec API simulée, contrôles SQL réels en recette et contrôles production non destructifs ; pas de saisie réelle au nom d’un utilisateur ni test sur PWA physique installé. Anciens clients à actualiser pour le nouveau format ; rollback frontend seul incompatible avec les nouveaux totaux. Deux avertissements ESLint et 12 vulnérabilités faibles/modérées préexistantes, aucune haute/critique ; taille du bundle historique. Ce correctif ne modifie ni les contrats hébergeurs ni le pilote Outlook.
