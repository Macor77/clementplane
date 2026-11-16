# V1.6.0 — Candidate vérifiée, 16 novembre 2026

**Non clôturé — validation et production restantes.** Correction développée et vérifiée dans la [PR #27](https://github.com/Macor77/clementplane/pull/27), en brouillon. Commit applicatif **280a2746ec02bbbbf293ea47328a420b6bd41afc**, version technique/lock/UI 1.6.0. L’accord de production V1.5.1 a été exécuté ; cette nouvelle version attend sa propre validation. Aucune migration.

| Exigence | État et preuve, 16 novembre 2026 | Reste |
|---|---|---|
| Deux décomptes + total | Vérifié : formulaire, OF et statistiques ; DESIGN, scénarios 14–18 | Publication |
| Compatibilité et zéro complet | Vérifié : 413 tests/61 fichiers, SQL PGlite et navigateur | Aucun recalcul destructif |
| Historique détaillé | Vérifié : conservation sur modification étrangère, classification explicite et statuts non réalisés ; revue indépendante résolue | Aucune anomalie restante identifiée |
| Mobile et aides | Vérifié : 67 parcours, 1440/768/390 px selon scénarios ; quatre captures examinées | Appareil/PWA physique non testé |
| Supabase et confidentialité | SQL/RLS/RPC inchangés ; tests PGlite/contrats réussis, preuve V1.5.0 applicable au déploiement existant | Aucune opération hébergée nécessaire |
| Statistiques | Complets/partiels/total séparés, heures et périodes conservées | Aucun export BPF livré |
| Qualité | Quality 43873670898 réussi, toutes étapes ; ACCEPTANCE | 2 warnings Hooks, gros bundle, 12 vulnérabilités faibles/modérées préexistants |
| Documentation | README, fonctionnel, architecture, base, décisions, tests, dépannage, exploitation et guide actualisés | Statut final après livraison |
| Légal/RGPD | LEGAL_REVIEW : aucune modification nécessaire motivée | Aucun contrat externe certifié |
| Roadmap/changelog/version | Candidate identifiée, historique conservé, version 1.6.0 | Statut de publication après accord |
| FAQ/tutoriels/évolutions/landing | COMMUNICATION, GUIDE, discoverContent ; captures fictives archivées | Aide BPF laissée au futur |
| GitHub/preview | PR #27 brouillon, preview Vercel READY sur le bon commit | Preview protégée, aucun parcours connecté réel prétendu |
| Production | V1.5.1 maintenue ; aucune fusion ou opération de production V1.6.0 | Validation utilisateur, fusion et vérifications de production |
| Archive | Candidate téléchargée, ZIP/707 entrées/manifeste/SHA-256 vérifiés ; ACCEPTANCE | Archive finale du commit de livraison |
| Tag/release | Non réalisés, livraison non autorisée à ce stade | Créer après accord et vérifications de production |
| Communication | Aide intégrée et notes suffisantes, aucun envoi | Aucun envoi autorisé ou prévu |
| Pilotage | RETOUR_PILOTAGE actualisé | Aucun sprint suivant démarré |

Portée exacte : tests locaux et navigateur CI avec API simulée, mobile émulé. Aucun nouveau parcours métier ni écriture en production. Le complément documentaire de recette conserve le code applicatif testé. La production reste V1.5.1 jusqu’à validation et publication effective.
