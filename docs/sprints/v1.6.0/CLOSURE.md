# V1.6.0 — Candidate, 16 novembre 2026

**Non clôturé — validation et production restantes.** Développement de la séparation des effectifs autorisé. L’accord de production V1.5.1 a été exécuté ; il ne constitue pas une validation de cette nouvelle version. Version technique/lock/UI : 1.6.0. Aucune migration.

| Exigence | État et preuve, 16 novembre 2026 | Reste |
|---|---|---|
| Deux décomptes + total | Développé, DESIGN et tests unitaires | Recette CI navigateur |
| Compatibilité et zéro complet | Vérifié localement, 413 tests/61 fichiers et PGlite | CI complète |
| Historique détaillé | Conservation sur modification étrangère, classification explicite ; revue indépendante résolue | Recette navigateur |
| Mobile, aides, OF | Scénarios 14–18 préparés, API simulée | Captures CI à examiner |
| Supabase et confidentialité | Code SQL/RLS/RPC inchangé ; tests locaux réussis, preuve V1.5.0 applicable au déploiement existant | Aucune opération hébergée nécessaire |
| Statistiques | Complets/partiels/total séparés, heures et périodes conservées | Aucun export BPF livré |
| Qualité | Build et unitaires réussis ; 2 warnings Hooks préexistants | Audit et Quality CI |
| Documentation | README, fonctionnel, architecture, base, décisions, tests, dépannage, exploitation actualisés | Preuves CI à inscrire |
| Légal/RGPD | LEGAL_REVIEW : aucun changement nécessaire motivé | Aucun nouveau contrat à certifier |
| Roadmap/changelog/version | Candidate identifiée, historique conservé, version 1.6.0 | Statut de publication à actualiser après accord |
| FAQ/tutoriels/évolutions/landing | COMMUNICATION, GUIDE, src/content/discoverContent.js | Captures fictives |
| GitHub/production | Branche de travail ; pas de fusion ou production | PR brouillon, puis validation utilisateur |
| Tag/archive/release | Archive candidate prévue dans Quality | Archive à contrôler ; tag/release définitifs après livraison |
| Communication | Aide intégrée et notes suffisantes, aucun envoi | Aucun envoi autorisé ou prévu |
| Pilotage | RETOUR_PILOTAGE | Aucun sprint suivant démarré |

Portée : tests locaux et navigateur CI à API simulée, mobile émulé. Aucun test sur appareil physique ni nouveau parcours métier en production. L’application de production reste V1.5.1 jusqu’à validation et publication effective.
