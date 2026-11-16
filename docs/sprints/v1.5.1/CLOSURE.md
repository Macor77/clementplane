# V1.5.1 — Clôture de livraison, 16 novembre 2026

Bilan compact avec aides « ? », toutes les explications conservées, labels/unités/confidentialité et inclusion des apprenants partiels visibles. Publication explicitement autorisée par Vincent. PR #26 fusionnée : `92a94bf6d8c7221983e22741a1106c8c86305e6b`. Version 1.5.1 dans package/lock/UI. Le tag v1.5.1 vise le commit documentaire de clôture, de code applicatif identique.

| Obligation | Résultat / preuve | Portée et reste |
|---|---|---|
| Périmètre et réalisation | Vérifié : DESIGN et diff applicatif, explications conservées | Aucune modification métier, une session = un groupe |
| Aide, clavier et mobile | Vérifié : scénario 17, fermeture bouton/Echap/fond, focus et défilement | 1440/768/390 px et tactile 390×480 ; captures fictives examinées |
| Sauvegarde et données | Vérifié : état propre/modifié, erreurs, conservation et rechargement | 406 unitaires et 63 navigateur, API simulée |
| Frais, partiels, statistiques et OF | Vérifié : scénarios 14–16 et suites de non-régression | Consultation OF sans champs privés ni nouveaux boutons |
| Supabase et permissions | Preuve V1.5.0 applicable, code inchangé et suites SQL/RLS réussies | Aucune migration, opération hébergée ou nouveau traitement |
| Qualité/CI | Quality candidate 43858430263 et main 43867762939 ; exact commit avant release | Deux warnings Hooks, gros bundle et 12 vulnérabilités faibles/modérées préexistants |
| Production et version | Vérifié : Vercel dpl_FELzSwNNBxridUZDaVuLfZfqVtCJ READY et HTTP 200 V1.5.1 | PRODUCTION.md ; contrôle sans écriture de données réelles |
| Documentation | README, fonctionnel, architecture, décisions, tests, dépannage, guide/exploitation actualisés | Modèle de base inchangé, aucune nouvelle documentation SQL nécessaire |
| Légal/RGPD | LEGAL_REVIEW : aucun nouveau traitement, destinataire, traceur ou sous-traitant | Aucune modification de document ou acceptation juridique nécessaire |
| Roadmap/changelog/version | Racine/docs synchronisés et historique conservé | Pas de prochain sprint démarré |
| Découvrir / FAQ / tutos / captures | Guide et FAQ intégrés actualisés ; captures réelles avec données fictives archivées | Landing et évolutions envisagées inchangées, aucune promesse nouvelle |
| GitHub / tag / archive / release | PR fusionnée ; workflow release-v1.5.1 conditionné à Quality du commit exact | ZIP/manifeste puis téléchargement et vérification requis |
| Communication | Aide intégrée et notes suffisantes pour cette amélioration | Aucun e-mail ni message envoyé |
| Pilotage | RETOUR_PILOTAGE à jour | Prochaine priorité laissée au pilotage |

Verdict : **clôturé** lorsque le workflow de release du commit est réussi et les pièces jointes vérifiées. Ce contrôle est requis avant le compte rendu final ; une intention de publication ne vaut pas preuve.

Limites : tests navigateur avec API simulée et mobile émulé ; production contrôlée sans parcours connecté réel. Aucun smartphone/PWA physique ni restauration fournisseur testé. Aucun changement de service worker, traitement des données ou pilote Outlook.

[PR #26](https://github.com/Macor77/clementplane/pull/26) · [Release v1.5.1](https://github.com/Macor77/clementplane/releases/tag/v1.5.1). Détails : DESIGN, ACCEPTANCE, OPERATIONS, PRODUCTION, GUIDE, LEGAL_REVIEW, COMMUNICATION.
