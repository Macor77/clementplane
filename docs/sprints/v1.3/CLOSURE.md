# V1.3.0 — suivi des réalisations et premières statistiques

**Statut : livraison préparée, non clôturée ; production soumise à accord explicite.** PR brouillon [#21](https://github.com/Macor77/clementplane/pull/21), branche `feature/v1.3-trainer-activity`. Production initiale V1.2.4 / `6bd5654` conservée pendant le développement.

## Résultat préparé
Bilans progressifs par mission/session/journée, réalisation explicite et heures réelles, effectifs agrégés, partage OF en lecture seule, données privées séparées. Statistiques réalisées et futures, périodes et données manquantes, accès aux bilans historiques. Contrat, planning, disponibilité, notifications et agendas inchangés par la saisie d’un bilan.

Trois migrations additives testées sur documentation-demo : tables/RLS/RPC ; compatibilité nouvelle notice ; validation avant arrondi et attribution serveur des auteurs. Aucun traitement de production ni communication.

## Définition de terminé
| Volet | État |
|---|---|
| Audit / conception / développement | Réalisés ; DESIGN et matrice ACCEPTANCE |
| Tests locaux / SQL hébergé | Réussis ; preuve détaillée dans ACCEPTANCE |
| Recette navigateur et CI exacte | 349 tests unitaires + 43 navigateur réussis sur c8adb463 ; statut CI final exigé sur la PR (archive incluse) |
| Revue indépendante | Corrections relues et validées ; aucun blocage restant identifié |
| Documentation projet / roadmap / aide | Actualisées avec état préparé, sans prétendre à une mise en ligne |
| Juridique / RGPD | Revue d’impact et documents mis à jour ; LEGAL_REVIEW |
| Landing / Découvrir / FAQ / tutoriels | Contenus intégrés préparés ; anciens PDF de tutoriels inchangés car parcours historiques inchangés ; nouveau guide dans USER_GUIDE |
| Version | 1.3.0 préparée ; aucun tag de publication |
| Archive | Génération reproductible et manifestes SHA-256 ; artifact candidat CI, archive définitive sur commit de release après autorisation |
| Release / production / contrôle connecté | En attente d’accord explicite, puis contrôles de livraison |
| Communication | Texte proposé, aucun envoi ; autorisation distincte requise |

## Limites connues
Deux avertissements ESLint préexistants (dépendances useEffect/useMemo), aucun nouvel échec lint. Audit npm : 12 vulnérabilités existantes (3 faibles, 9 modérées), aucune haute/critique ; pas de mise à jour majeure hors périmètre. Avertissement historique de taille de bundle. Sources statistiques paginées, agrégation navigateur : à réévaluer pour très grands historiques.

La branche de recette Supabase conserve un statut historique MIGRATIONS_FAILED sans reset ; son PostgreSQL est ACTIVE_HEALTHY et les contrôles ciblés ont réussi. Les alertes de sécurité préexistantes ne sont pas assimilées à des alertes des nouveaux objets. Aucun test réel Outlook chez Amélie n’est remplacé ni clôturé par ce sprint.

## Restant obligatoire après accord
Suivre OPERATIONS : vérifier commits/CI, appliquer seulement les trois migrations ciblées, déployer, contrôler en ligne, compléter les preuves et le retour pilotage, tagger v1.3.0, produire et vérifier l’archive exacte et la release. Ne pas annoncer « sprint clôturé » avant ces étapes.
