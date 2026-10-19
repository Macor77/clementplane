# État du correctif — 19 octobre 2026

**Clôturé — V1.2.2, 19 octobre 2026.** Publication, production et clôture autorisées par Vincent dans cette conversation. Aucun e-mail envoyé.

- PR intégrée : https://github.com/Macor77/clementplane/pull/14
- Commit applicatif et tag v1.2.2 : `c0444870edd45ea0bbd5c7fc303e6d7edce49762` ; arbre `7102217e6b91aed7f920acecec0b18fb821377fb`, identique à la branche testée `0f871fce1410613db1a0f9c1bf1efcef4a0ed544`.
- CI PR : https://github.com/Macor77/clementplane/actions/runs/39206943820 ; CI main : https://github.com/Macor77/clementplane/actions/runs/39207118376 — réussies. 226 tests et 18 tests navigateur dans Quality, contrôles SQL/RLS, sécurité, audit et build réussis.
- Production Vercel READY : `dpl_EvVkAsWBfbFRzzSMr5aNeWkoCcyT`, projet `prj_gNJbyUiPEIkj5ZPdJozxKbrmD3QE`, commit applicatif ci-dessus ; alias www.clementplane.fr, clementplane.fr et app.clementplane.fr.
- Contrôle après livraison : quatre tests du JavaScript réellement servi sur www.clementplane.fr, OF/formateur × 1440/390 px, conservation de la saisie et déconnexion ; un test de version V1.2.2 visible sur /formateur/decouvrir. Tous réussis. API Supabase interceptée avec données fictives : contrôle du frontend déployé, pas une recette d'authentification réelle ni une écriture en production.
- Release : https://github.com/Macor77/clementplane/releases/tag/v1.2.2 ; archive `Clementplane_v1.2.2_Sources.zip`, 16 972 441 octets, SHA-256 `8add2ec258afd691c58671777bd19140675f829fc72a19ef5874fe7095b11119`.
- Workflow archive et téléchargement vérifiés : https://github.com/Macor77/clementplane/actions/runs/39207258514 — succès. Contrôle SHA-256 et ouverture ZIP après téléchargement ; manifeste interne par fichier, commit et version inclus.
- Le présent complément documentaire est postérieur au commit applicatif tagué. Il ne modifie ni src, ni dépendances, ni configuration de build ; les preuves applicatives restent valides. L'archive reste attachée au commit applicatif exact, sans déplacer son tag.


| Exigence | État / preuve | Environnement / suite |
|---|---|---|
| Reproduction | Vérifié : test navigateur échouant avant correction, saisie vide ; après première correction, échec OF révélant AccountRouter | Build local, SDK réel, API fictive |
| Conservation des formulaires | Vérifié : 4 scénarios OF/formateur × desktop/mobile ; valeur conservée et même nœud DOM, puis déconnexion | Chromium automatisé ; appareil/PWA réel non testé |
| Non-régression | Vérifié : 9 tests navigateur dont 2 cycles mission personnelle et 3 scénarios disponibilités | API simulée, aucune écriture réelle |
| Tests automatisés | Vérifié : 42 fichiers, 226 tests réussis avec configuration fictive CI | Premier lancement sans variables : 2 suites en erreur ; corrigé en utilisant la configuration requise |
| Build | Vérifié : build Vite/PWA réussi | Avertissement habituel taille des chunks |
| Lint | Vérifié : 0 erreur ; 2 avertissements existants usePlanningAvailability et TrainerSearch | Aucun nouveau warning |
| Audit | Vérifié : 0 high/critical, 3 moderate existantes liées à Vitest/mocker/coverage | Mise à jour majeure hors périmètre |
| Supabase | Non applicable pour migration/déploiement serveur : uniquement consommation des événements côté React | Auth/RLS et secrets inchangés ; pas de contrôle live revendiqué |
| Légal/RGPD | Aucune modification nécessaire : CGU, confidentialité, mentions légales, cookies, registre, DPA et procédures | Pas de nouveau traitement ni stockage ; formulaire reste en mémoire |
| Aide, FAQ, tutoriels, captures, Découvrir, évolutions envisagées | Aucune modification nécessaire : comportement attendu rétabli, aucune nouvelle interface | Revue du périmètre effectuée |
| Communication | E-mail de nouveauté non pertinent pour ce correctif ; aucun envoi autorisé ni réalisé | Pas de sollicitation des formateurs |
| GitHub / CI distante | Vérifié : PR #14 intégrée, Quality PR/main réussies | Références ci-dessus |
| Production, recette en ligne, version, tag, release et archive | Vérifié : déploiement READY, 5 tests du frontend servi, version visible, tag et archive téléchargée/contrôlée | API fictive ; références ci-dessus |

Preuves exécutables : tests/e2e/specs/10-form-tab-return.spec.js, 06-personal-missions-ui.spec.js et 09-availability-recovery.spec.js. Les événements de visibilité sont synthétiques et transitent par le vrai SDK. Aucun contournement de l'authentification en production.

## Documentation, exploitation et périmètre

README, CHANGELOG et ROADMAP racine/docs, fonctionnel, architecture et tests harmonisés ; DATABASE inchangé (aucune donnée/API serveur modifiée), décisions métier inchangées. Revue technique de l'impact légal uniquement, pas une certification juridique : aucun nouveau destinataire, stockage, traceur, sous-traitant ou changement de conservation/droits/procédure de violation ; aucune modification des documents légaux requise par ce diff.

FAQ, tutoriels, captures, page Découvrir, landing et évolutions envisagées : fonctionnement attendu restauré, pas de nouvelle promesse ; seul le numéro de version visible change. Communication de nouveauté inutile pour ce correctif.

Retour arrière : revert du correctif frontend ou restauration du déploiement V1.2.1 précédent (`dpl_9NXKdDKFbwNXGvCN6R48hZ6wXBTn`) ; aucune migration. Surveillance via Quality et test permanent 10-form-tab-return. Les limitations appareil/PWA réel et session réelle sont des limites des preuves, pas des fonctionnalités nouvelles annoncées. Fermeture/rechargement complet et éviction mémoire restent hors périmètre. Aucun autre sprint lancé.
