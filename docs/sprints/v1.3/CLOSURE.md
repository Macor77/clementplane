# Bilan de clôture — V1.3.0

**Livré en production le 12 novembre 2026, après autorisation explicite de Vincent.** PR [#21](https://github.com/Macor77/clementplane/pull/21) fusionnée ; déploiement applicatif `cb0c1ccd`, Vercel `dpl_Y21sa77eUwDXQPRQFbQh2FV4gzVu` READY. Détail des contrôles : PRODUCTION.md.

## Résultat livré
Bilans progressifs par mission/session/journée, réalisation explicite et heures réelles, effectifs agrégés, partage OF en lecture seule, données privées séparées. Statistiques réalisées et futures, périodes et données manquantes, accès aux bilans historiques. Contrat, planning, disponibilité, notifications et agendas inchangés par la saisie d’un bilan.

## Définition de terminé
| Volet | Résultat / preuve |
|---|---|
| Audit / conception / développement | Réalisés ; DESIGN, PR #21 et matrice ACCEPTANCE |
| Tests | 349 tests unitaires, 43 navigateur, SQL/RLS PGlite et PostgreSQL hébergé de recette ; Quality de PR et de main vertes |
| Revue indépendante | Deux points importants et attribution OF corrigés ; contre-revue sans blocage |
| Production | Trois migrations appliquées, Vercel READY, assets publics et refus API/RLS vérifiés ; PRODUCTION et OPERATIONS |
| Documentation / roadmap | Actualisées ; suivi des décisions et limites conservé |
| Aide / tutoriels / landing | Parcours Découvrir, FAQ, présentation et USER_GUIDE actualisés. Anciens PDF inchangés car parcours historiques inchangés ; captures de recette fictives relues |
| Juridique / RGPD | Notice 2026-11-12, registre, conservation et droits mis à jour ; CGU et autres textes revus selon LEGAL_REVIEW |
| Version / tag / release | V1.3.0 ; publication vérifiée par le workflow de release sur le commit documentaire exact, après Quality |
| Archive | Sources exactes, sans secrets/caches/archives imbriquées, manifestes SHA-256 ; téléchargement et intégrité vérifiés par le workflow de release |
| Communication | Proposition conservée dans COMMUNICATION ; aucun envoi autorisé ni effectué |

La clôture finale est matérialisée par la [release v1.3.0](https://github.com/Macor77/clementplane/releases/tag/v1.3.0) et la réussite de son workflow de publication. Le tag indique le commit exact, les pièces jointes donnent l’archive et son SHA-256. Ne pas assimiler une seule compilation à cette preuve.

## Limites conservées
Deux avertissements ESLint préexistants, 12 vulnérabilités npm existantes (3 faibles, 9 modérées), aucune haute/critique au contrôle ; avertissement historique de taille de bundle. Pas de mise à jour majeure hors périmètre. Sources statistiques paginées, agrégation navigateur à réévaluer pour très grands historiques.

Les tests navigateur utilisent des API simulées avec données fictives ; la recette SQL est réelle sur documentation-demo. Les contrôles production sont non destructifs : aucun bilan réel saisi à la place d’un utilisateur. Le statut historique MIGRATIONS_FAILED de la branche de recette n’a pas été réinitialisé ; PostgreSQL ACTIVE_HEALTHY et contrôles ciblés réussis. Aucun test Outlook chez Amélie remplacé ni clôturé.

## Suite
Observer la complétude des bilans avant de prioriser des statistiques approfondies et une aide au BPF. Facturation, rentabilité, comptabilité et export BPF restent exclus. Aucun nouveau sprint ni campagne lancés automatiquement. Retour arrière conservant les bilans : OPERATIONS.
