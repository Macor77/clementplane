# Publication — 27 octobre 2026

Vincent a autorisé la production dans cette conversation : « OK parfait. Vas-y tu peux publier en production. »

- PR : https://github.com/Macor77/clementplane/pull/18, fusionnée.
- Commit applicatif de fusion : `11854cda0aa70ecc86044d0db9a336c634ca8e48`.
- Arbre identique à la branche testée : `7e7e975de94feed9eeeefe6085128f37dada6043`.
- CI préalable réussie : https://github.com/Macor77/clementplane/actions/runs/40526127775 (Quality #127).
- Projet Vercel : `clementplane`, `prj_gNJbyUiPEIkj5ZPdJozxKbrmD3QE`, équipe formaplane.
- Déploiement applicatif : `dpl_8vNVKHAEkAKDDknwN7HtyXr3RRBD`, cible production, READY, aucune erreur d’alias.
- URL de déploiement : https://clementplane-4f5qoa2po-formaplane.vercel.app
- Domaines associés vérifiés : clementplane.fr, www.clementplane.fr, app.clementplane.fr.

## Vérifications en ligne
- https://clementplane.fr : réponse HTTP 200, titre Clementplane, contenu affiché dans Chromium.
- Bundle servi `/assets/index-CJj41HUT.js`, feuille `/assets/index-Byayr1n8.css` ; FAQ multi-onglets et code de navigation présents.
- Accès direct, navigateur sans session, à une URL mission et une URL formateur avec identifiants fictifs : redirection `/connexion` dans les deux cas.
- Aucune erreur JavaScript de page sur ces parcours.
- Aucun compte réel utilisé, aucune mission créée/modifiée, aucun message envoyé. La recette complète connectée reste celle réalisée sur API fictive avant fusion (282 tests, 31 scénarios navigateur). Ces vérifications ne prétendent pas constituer une recette sur un compte client réel ou une PWA installée.

Aucune migration, fonction serveur, permission ou configuration à activer. Disponibilité générale du frontend, sans nouveau drapeau d’activation. Les fichiers de documentation ajoutés après cette fusion ne modifient pas le code applicatif ni les dépendances.

Retour arrière : revert de la PR #18 ou rétablissement du précédent déploiement Vercel `dpl_ByY8RApGpDJM9BH5niATsG4jCQRM`. Aucune opération de base nécessaire.

Publication effectuée ; ce compte rendu ne vaut pas clôture complète avec nouvelle version/tag/release/archive. La version affichée reste 1.2.4. Aucun e-mail de nouveautés demandé ou envoyé.
