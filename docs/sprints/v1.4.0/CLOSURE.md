# V1.4.0 — clôture de livraison, 15 novembre 2026

Périmètre validé : dépenses détaillées privées dans le bilan de mission. Vincent a validé le candidat puis autorisé explicitement la mise en production le 15 novembre. PR #24 fusionnée : 46fe8711b6ff8c073a4e34f89bf2613d8ddfe295. Version 1.4.0 dans package/lock/UI. Le commit documentaire pointé par le tag v1.4.0 conserve le même code applicatif.

| Exigence | Résultat et preuve du 15 novembre 2026 | Environnement / reste |
|---|---|---|
| Onze catégories, répétitions, précision other, total exact, zéro/vides/invalides | Implémentés, tests utilitaires/SQL et 4 nouveaux parcours | Recette + production, aucun reste |
| Édition, suppression, rechargement, brouillon, autres champs | Sauvegarde atomique/CAS/reprise conservée ; 389 unitaires et 53 parcours réussis | API simulées + PostgreSQL recette ; aucun reste |
| Migration non destructive | Deux anciens bilans conservés, archives et centimes identiques, empreintes inchangées | Production 20261115114709 ; aucune migration à rejouer |
| Confidentialité UI/API/RLS | Séparation privée, owner/OF/tiers en recette, RLS/droits/fonctions identiques en production | Vérifié, aucun reste |
| Agenda et kilométrage | Kms indépendants, projection exclut frais même avec options notes/tarif | Tests + code inchangé, aucun reste |
| Un groupe par session et statistiques | Régression vérifiée ; structure prête pour future analyse privée | UI statistiques inchangée à la demande |
| Qualité et sécurité | Quality candidat 43708788416, main 43710604664 ; audit sans haute/critique | Deux avertissements lint et 12 vulnérabilités faibles/modérées préexistants, hors changement |
| Interface | Captures 1440/768/390 px inspectées, commandes et total accessibles | Chromium ; appareil/PWA installé non testé, mécanisme PWA inchangé |
| Production | Vercel dpl_5GSirpiLDUGcwCHfcuCGny1m2FvZ READY, HTTP 200, asset V1.4.0 | app.clementplane.fr ; aucun vrai bilan modifié |
| Documentation | README, roadmap, changelog, PRD, fonctionnel, architecture, base, décisions, tests, dépannage et exploitation | Synchronisés dans ce commit |
| Légal/RGPD | Revue technique LEGAL_REVIEW, registre et droits complétés ; autres textes inchangés avec motif | Aucune nouvelle finalité, aucun destinataire ajouté |
| Découvrir / FAQ / tutos / landing | Tutoriel intégré mis à jour ; FAQ confidentialité correcte ; captures de recette fictives, aucune promesse landing changée | Aucun tutoriel avec anciennes dépenses à remplacer identifié |
| Évolutions envisagées | Statistiques approfondies/BPF restent des pistes ; dépenses détaillées n’y étaient pas annoncées comme futures | Revue faite, aucun ajout arbitraire |
| GitHub / tag / archive / release | PR #24 intégrée ; workflow release-v1.4.0 publie le commit exact après Quality et vérifie le téléchargement | Preuve exécutable : workflow et release liés dans PRODUCTION |
| Communication | Aide intégrée et notes suffisent pour cette amélioration ciblée ; pas de campagne dédiée | Aucun envoi autorisé ni effectué |
| Bilan/pilotage | RETOUR_PILOTAGE actualisé ; futur sprint statistiques à cadrer séparément | Aucun prochain sprint lancé |

Verdict : **clôturé** lorsque le workflow de release lié à ce commit est réussi et les pièces jointes vérifiées. Ce contrôle final est requis avant le compte rendu de clôture ; il ne peut être remplacé par une simple intention documentaire.

Limites des preuves : API simulées pour le navigateur, PostgreSQL réel en recette ; production contrôlée sans saisie métier ni extraction privée. Aucune restauration de sauvegarde fournisseur ou test matériel iOS/Android revendiqué. Aucun changement de la synchronisation Outlook ni validation additionnelle de son pilote.

Détails : DESIGN, ACCEPTANCE, OPERATIONS, PRODUCTION, GUIDE, LEGAL_REVIEW et COMMUNICATION dans ce dossier. [PR #24](https://github.com/Macor77/clementplane/pull/24) · [Release v1.4.0](https://github.com/Macor77/clementplane/releases/tag/v1.4.0).
