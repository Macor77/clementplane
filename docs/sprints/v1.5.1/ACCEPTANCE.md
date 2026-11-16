# Recette V1.5.1 — validée le 16 novembre 2026

Commit applicatif : `873d3ffde95f253b14c0f68c6898bc01a0a44f97`. PR [#26](https://github.com/Macor77/clementplane/pull/26), brouillon. [Quality 43857208016](https://github.com/Macor77/clementplane/actions/runs/43857208016), job `133264432989`, réussi. Exécution sur merge synthétique `933a65030c795501d3d0485e0fc26f8e5568defc` avec base main `86832b7`.

| Exigence | Résultat et preuve |
|---|---|
| Explications conservées, champs/unités/visibilité directs | Vérifié : revue du diff et scénario 17 (aides bilan, tarif/partage, réalisation, privé, dépenses, kilométrage et partiels) |
| Fermeture par bouton, Echap, fond et restitution du focus | Vérifié : scénario 17, contenu parcouru au clavier ; modal natif pour le fond inerte |
| Mobile/tablette/ordinateur | Vérifié : 390×1000, 768×1000, 1440×1000 ; aucun débordement horizontal |
| Petit écran tactile | Vérifié : 390×480, texte défilable, bouton Fermer accessible, restauration du défilement à la fermeture et au démontage |
| Aide sans changement/sauvegarde du bilan | Vérifié : état propre, état modifié, aucune requête d’enregistrement ou envoi lors de la consultation |
| Erreur, enregistrement et rechargement | Vérifié : brouillon et erreur conservés, puis sauvegarde des observations, frais, kms, difficultés et participations |
| Fonctionnement métier existant | Vérifié : scénarios 14–16, historique, OF en lecture seule, statistiques, total des dépenses et des apprenants |
| SQL/RLS/RPC, calendrier | Suites Quality réussies ; aucune modification de ces composants, aucun changement de base hébergée |
| Revue indépendante | Aucune anomalie importante restante ; ajout du scénario 17 au workflow vérifié |

406 tests unitaires/contrats réussis et 63 parcours Chromium réussis (dont 5 nouveaux). Suites PostgreSQL/PGlite et build réussis. ESLint : deux avertissements préexistants (usePlanningAvailability / TrainerSearch), aucune erreur. Audit : 12 vulnérabilités préexistantes (3 faibles, 9 modérées), aucune élevée/critique ; aucune dépendance ajoutée. Avertissement de bundle volumineux préexistant. Premier lancement local sans variables Supabase fictives : deux suites non initialisées ; relance avec la configuration Quality réussie.

## Contrôle visuel et gain de place

Artifact navigateur `14221413732` du run ci-dessus : captures `activity-compact-{1440,768,390}.png`, `activity-help-{1440,768,390}.png`, `activity-help-small-mobile.png`, contrôlées visuellement. Fenêtre centrée desktop/tablette, panneau bas mobile ; texte et fermeture lisibles. Comptes et données exclusivement fictifs.

Comparaison du même scénario existant `activity-form-390.png` : page de 3 963 px en V1.5.0 (run `43845110192`, artifact `14215550284`) contre 3 222 px, soit 741 px de moins / 18,7 % de hauteur de page en moins. Cette mesure concerne ce cas de recette, pas toutes les missions.

## Portée et limites

API simulée pour les essais navigateur ; les suites SQL utilisent PGlite. Aucun appareil physique ni PWA installée réelle testé pour cette évolution ; moteur/service worker inchangés. Aucun test métier ni modification en production. Prévisualisation Vercel `dpl_4ziHydbErps5f1rcHgKV4NxDdyWS` READY sur le commit applicatif, mais protégée par l’authentification Vercel : le HTTP 200 redirigé vers la connexion ne constitue pas une preuve de parcours de l’application. Les preuves visuelles proviennent de la CI.

## Archive candidate vérifiée

Artifact `14221970731` : `Clementplane_v1.5.1_Candidate.zip`, 692 entrées. SHA-256 `4f289eb0db0deb871e00b7595f241360ede2f0feaeff216bcbccee7a1b61b772`. ZIP téléchargé, ouverture et chaque entrée du MANIFEST.sha256 vérifiées ; SOURCE_COMMIT confirme le merge synthétique `933a65030c795501d3d0485e0fc26f8e5568defc`. Archive de recette initiale ; les compléments documentaires suivants ne changent pas l’application. Archive finale de release après publication autorisée.

Deux captures de ce run sont également conservées dans `assets/bilan-mobile.png` et `assets/aide-mobile.png`, sans modification de l’image.
