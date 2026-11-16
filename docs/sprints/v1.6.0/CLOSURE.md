# V1.6.0 — Clôture de livraison, 16 novembre 2026

Deux décomptes distincts (entièrement formés / partiellement formés), total des participants calculé, aides/lecture OF/statistiques cohérentes. Publication explicitement autorisée par Vincent le 16 novembre. [PR #27](https://github.com/Macor77/clementplane/pull/27) fusionnée : **3e92d588537d3fe0df1279dd6824fdede734c252**. Version package/lock/UI 1.6.0. Aucun changement de schéma ou de permissions. Le tag v1.6.0 vise le commit documentaire de clôture, de code applicatif identique.

| Obligation | Résultat et preuve, 16 novembre 2026 | Portée / suite |
|---|---|---|
| Périmètre et réalisation | Vérifié : DESIGN et scénarios 14–18, complet/partiel/total séparés | Une session reste un groupe, pas de BPF automatique |
| Anciens bilans / durées | Vérifié : conversion 4 inclusifs vers 3 + 1, sauvegarde inverse, zéro complet et durées inconnues | Historique détaillé non reclassé lors d’une modification étrangère |
| Sauvegarde / non-régression | Vérifié : 413 tests unitaires/contrats et 67 parcours navigateur | Rechargement, ajout/suppression, frais/km/difficultés préservés |
| Mobile / aides / OF | Vérifié : 1440/768/390 px selon scénarios ; quatre captures examinées | API simulée, mobile émulé ; pas de smartphone/PWA physique |
| Supabase et confidentialité | Code SQL/RLS/RPC inchangé ; suites PGlite et contrats réussis ; preuve de déploiement V1.5.0 applicable | Aucune migration ni opération hébergée nécessaire |
| Revue | Revue indépendante terminée, anomalies historiques corrigées et retestées | Aucun point concret restant identifié |
| Qualité | Quality candidate 43873670898 et 43874641015 réussis ; main 43876479305 ; Quality requis sur le commit exact avant release | 2 warnings Hooks, gros bundle et 12 vulnérabilités faibles/modérées préexistants |
| Production/version | Vérifié : dpl_3Lz7f98q6DZLzVoQeNJt9dQ4A65X READY, HTTP 200 et bundle V1.6.0 | PRODUCTION.md ; aucun parcours connecté réel prétendu |
| Documentation | README, fonctionnel, architecture, base, décisions, tests, dépannage, exploitation et guide actualisés | Historique daté conservé |
| Légal/RGPD | LEGAL_REVIEW : aucune modification nécessaire motivée pour chaque obligation | Pas de nouvelle collecte ou de contrats externes certifiés |
| Roadmap/changelog/version | Racine/docs cohérents, version 1.6.0 | Futur BPF laissé au pilotage |
| Découvrir/FAQ/tutoriels/captures | Aides/FAQ/tutoriels OF/formateur actualisés et captures fictives archivées | Landing inchangée, aucune nouvelle promesse |
| GitHub/tag/archive/release | PR fusionnée ; workflow release-v1.6.0 sur le SHA de clôture après Quality | ZIP/manifeste et téléchargement vérifiés par le workflow avant clôture finale |
| Communication | Aide intégrée et notes suffisantes ; aucun e-mail ni message envoyé | Aucun envoi prévu |
| Pilotage | RETOUR_PILOTAGE actualisé | Aucun sprint suivant démarré |

Verdict : **clôturé** lorsque le workflow de release du commit est réussi, le tag concordant et les pièces jointes vérifiées. Ce contrôle est requis avant le compte rendu final ; une intention de publication ne vaut pas preuve.

Limites : navigateur avec API simulée, mobile émulé et production vérifiée sans écriture métier réelle. Aucun smartphone/PWA physique ni restauration fournisseur testé. Durées individuelles conservées, sans export ni déclaration BPF. Aucun changement du pilote Outlook.

[Release v1.6.0](https://github.com/Macor77/clementplane/releases/tag/v1.6.0). Détails : PRODUCTION, ACCEPTANCE, OPERATIONS, DESIGN, GUIDE, LEGAL_REVIEW et COMMUNICATION.
