# V1.7.0 — Livraison candidate, 17 novembre 2026

Le développement demandé est prêt à valider dans la [PR #28](https://github.com/Macor77/clementplane/pull/28), conservée en brouillon. **La mise en production de V1.7.0 n'est pas autorisée à ce stade.** Aucun déploiement de production ni migration hébergée effectué. La version officielle reste V1.6.0.

Le CA représente les formations réalisées et les montants déclarés, HT/TTC séparés. La page mobile propose frais privés par catégorie/dépense, chiffres consultables par mission, aides « ? », périodes et filtres, évolution/comparaison, bilans à compléter avec fin de session et objectif mensuel facultatif.

| Obligation | Résultat / preuve | Limite ou suite |
|---|---|---|
| Périmètre et règles | Plan, GUIDE et calculs testés | Aucun bénéfice, encaissement ou BPF automatique |
| Calculs / compatibilité | 424 unitaires/contrats passent | Ancrages historiques et décomptes de présence conservés |
| Mobile / navigation | 74 parcours Chromium, 320/390/768/1440 px, aides, focus, détails et objectifs | API simulée, pas de téléphone physique |
| Confidentialité | RLS PGlite exécutée, requête privée propriétaire séparée, aucun champ kilomètres/difficultés chargé | Auth/PostgREST hébergés non testés pour cette version |
| Migration | 20261117134215_trainer_statistics_goals.sql additive, quatre politiques et contraintes testées | À appliquer après validation, projet de démonstration non exposé par le connecteur |
| Revue indépendante | REVIEW : défaut de retry objectif corrigé, garde de dialogue ajoutée | Aucun point important restant identifié |
| Qualité | Quality 44100541684 sur code applicatif 7b65df3 ; tout passe | Deux warnings Hooks, taille bundle et dépendances faibles/modérées préexistants |
| Documentation / légal | Architecture, base, fonctionnel, dépannage, registre, guide et FAQ actualisés | Aucun nouveau sous-traitant ni permission OAuth |
| Captures / archive | Huit captures fictives issues de CI ; manifeste de sources et checksum générés | Vérification archive avant compte rendu final |
| GitHub / version | PR #28, package/lock/UI 1.7.0 | Pas de merge, tag ou release production |
| Communication / pilotage | COMMUNICATION et RETOUR_PILOTAGE | Aucun e-mail envoyé, aucun sprint suivant lancé |

Le code applicatif final est `7b65df3daaa933573d5267b8b47f6fee25c44b26`. Le dernier commit du dossier ne change que documentation et captures. La PR conserve le statut du contrôle Quality associé au commit courant. Les sources sont archivables de manière reproductible par le script fourni ; aucun secret ni cache n'est inclus.

L'autorisation future de production permettra d'appliquer la seule migration d'objectifs, de publier, de vérifier la version servie, puis de clôturer la release. Le repli garde les données et revient au frontend précédent ; voir OPERATIONS.md.
