# V1.7.0 — Clôture de livraison, 17 novembre 2026

Statistiques formateur mobiles : CA réalisé HT/TTC, frais privés par catégorie/dépense, chiffres consultables par mission, aides « ? », périodes/filtres, évolution/comparaison, fins de session et objectif mensuel facultatif. Production explicitement autorisée par Vincent et PR #28 fusionnée. Version package/lock/UI 1.7.0 ; une migration additive d’objectifs, sans modification des anciens bilans.

| Obligation | Résultat et preuve | Portée / suite |
|---|---|---|
| Périmètre | Vérifié : plan, GUIDE, scénarios 19 | Une session = un groupe ; ni bénéfice, paiement ni BPF automatique |
| Développement / historique | Vérifié : code 7b65df3, PR #28, fusion 0ed5582 | Présences, ancrages et archives conservés |
| Recette / qualité | 424 unitaires/contrats, 74 parcours navigateur et suites SQL passent ; Quality 44101852870 | Deux warnings Hooks, taille bundle et dépendances faibles/modérées préexistants |
| Mobile / aides | Captures 320/390/768/1440 px, aides, focus, listes et objectifs vérifiés | API simulée et mobile émulé ; pas d’appareil physique |
| Supabase | Migration distante 20261117142308, schéma/RLS/grants réels vérifiés | Pas de mutation métier de test en production ni de test Auth/PostgREST connecté |
| Revue | REVIEW : reprise objectif et dialogue corrigés | Aucun point important restant identifié |
| Production | Vercel READY sur SHA fusion, alias officiels, V1.7.0 et SW contrôlés | PRODUCTION.md ; contrôle identique requis après commit documentaire |
| Documentation / légal | README, fonctionnel, architecture, base, tests, décisions, exploitation, registre, conservation, droits et matrice légale actualisés | Revue technique ; contrats externes non réaudités |
| Roadmap / changelog / version | Racine et docs synchronisés, 1.7.0 | Aide BPF reste au pilotage |
| Découvrir / FAQ / tutoriels | Aide embarquée et FAQ actualisées, huit captures fictives archivées | Landing inchangée, promesses existantes compatibles |
| GitHub / tag / archive / release | PR fusionnée ; release-v1.7.0 après Quality du SHA exact, ZIP téléchargé et vérifié par workflow | Clôture finale subordonnée au succès vérifié du workflow et à la concordance du tag |
| Communication | Aide et notes suffisantes ; aucun e-mail envoyé | Aucun envoi prévu sans demande explicite |
| Pilotage | RETOUR_PILOTAGE actualisé | Aucun sprint suivant lancé |

Verdict : **clôturé** lorsque le workflow release-v1.7.0 a réussi, le tag concorde et les pièces jointes ont été vérifiées. Ces contrôles doivent être observés avant le compte rendu utilisateur, jamais déduits d’une simple intention.

La release https://github.com/Macor77/clementplane/releases/tag/v1.7.0 porte l’archive du commit exact. La comparaison applicative au SHA de fusion doit être vide. Une publication documentaire ne rejoue pas la migration et conserve les données.

Limites qualifiées : tests fonctionnels avec API simulée, RLS PGlite et introspection de production ; pas de téléphone/PWA physique, ni restauration fournisseur ou parcours connecté réel. Aucun élargissement du pilote Outlook, aucun envoi aux partenaires.
