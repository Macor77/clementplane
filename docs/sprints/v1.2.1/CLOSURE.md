# V1.2.1 — Clôturé

Autorisation explicite de Vincent du 15 octobre 2026 : fusion, production et clôture, sans e-mail. Ce bilan remplace les états préparatoires.

## Livrables et preuves

| Contrôle | Preuve du 15 octobre 2026 | État |
|---|---|---|
| Périmètre | PLAN.md, confirmation serveur, reprise réseau/session, sans file offline | Vérifié |
| Code | PR #12 fusionnée, commit applicatif 5a360939b93351dd1618b856ece3c356c32f9b74 | Livré |
| Qualité | Quality #106, run 38731538547 sur 3764a8f ; Quality main run 38750844148 | Succès |
| Recette | 226 tests ; 14 tests Chromium dont panne réseau/reprise 1440 et 390 px, sauvegarde retardée, 401 | Vérifié, API simulée |
| Captures | Artefact 11970790630, SHA256 6da3bf07e917e3f0305431c3ac105e3b36cc78486f24993e9e550970315c0350 ; téléchargement et vues desktop/mobile contrôlés | Vérifié |
| Supabase réel | Lecture des droits sur les 5 RPC de lecture/écriture : authenticated oui, anon non | Vérifié, aucune migration |
| Déploiement | Statut Vercel success sur 5a36093 : https://vercel.com/formaplane/clementplane/4fqjxPMZdLr6mTHz4y18KSEY8Fyx | Livré |
| Contrôle public | https://app.clementplane.fr/ HTTP 200 ; bundle index-kHp_aTNz.js contenant les messages de reprise | Vérifié, sans connexion utilisateur |
| Version | package/lock 1.2.1 ; complément du libellé V1.2.1 dans cette clôture | Vérifié le 15 octobre : bundle index-BZLuKGmv.js, V1.2.1 |
| Documentation | README, architecture, base, décisions, fonctionnel, tests, dépannage, roadmap et changelogs actualisés | Réalisé |
| Découvrir | Conseil déplacé vers le tutoriel des disponibilités ; capture nominale conservée, futures évolutions/landing inchangées | Réalisé |
| Communication | Aucun e-mail, conformément à la décision de Vincent | Réalisé |
| Tag / archive / release | Workflow Release V1.2.1 sources, déclenché après Quality réussi du merge release-v1.2.1 | Vérifié le 19 octobre : release publiée, archive téléchargée et contrôlée |
| Bilan pilotage | RETOUR_PILOTAGE.md | Actualisé |

## Revue technique d'impact légal

Documents consultés : src/pages/LegalPage.jsx et docs/rgpd/*.md. CGU : aucun nouvel engagement ; confidentialité et registre : mêmes données/finalités ; mentions : même exploitant/hébergeur ; traceurs : aucune nouvelle persistance ; sous-traitants/DPA : aucun nouveau prestataire ni flux ; conservation : mêmes durées ; droits et violation : mêmes procédures. Aucune modification nécessaire pour ce correctif. Ceci ne certifie pas les contrats externes et n'est pas un avis juridique.

## Portée et limites

La cause précise de la perte de session initiale sur Safari n'a pas été reproduite. Les mécanismes d'erreur/reprise sont testés avec des API fictives ; aucune modification du compte du signalant. Pas de test sur Safari physique ni PWA installée réelle, pas de revendication de recette sur ces appareils. Le contrôle production porte sur livraison HTTP, version/messages et maintien des droits, pas sur une écriture réelle dans un compte formateur.

Le connecteur Vercel retourne 403 sur l'équipe formaplane et aucune CLI authentifiée n'est disponible. Preuves alternatives indépendantes : statut Vercel signé dans GitHub pour le commit et contrôle du domaine public. Les journaux privés Vercel ne sont pas consultés.

Trois alertes modérées préexistantes concernent Vitest/mocker/coverage-v8 ; aucune haute/critique. Mise à niveau majeure de l'outillage à traiter séparément. Avertissement de taille du bundle préexistant, sans changement de dépendance.

## Exploitation

Surveiller les rejets 401 et erreurs de disponibilité via les journaux existants et retours support. En cas de résultat incertain, relire le calendrier avant une nouvelle saisie. Retour arrière : revenir au frontend antérieur ; aucune migration à annuler. Ne pas désactiver les droits d'accès pour résoudre une erreur de session.

Les seuls compléments applicatifs de clôture sont le texte d'aide et le libellé de version, sans modification du moteur testé. La release vérifie l'archive complète depuis son commit exact, sans secrets/caches ; les sources incluent ce dossier. Le téléchargement et le contrôle final ont été réalisés le 19 octobre 2026.

## Clôture finale — 19 octobre 2026

Verdict : **Clôturé** dans le périmètre de validation décrit ci-dessus.

- Commit final applicatif et tag v1.2.1 : 49d7e9f525ccef50f3d666f8febb7e4a6c3c5039 ; PR #13 fusionnée.
- Quality main 38751886544 : succès. Release 38752123283 : succès le 15 octobre, y compris téléchargement et vérification de la pièce jointe.
- Déploiement final Vercel : https://vercel.com/formaplane/clementplane/2e375R9JDLV2F6nhuu1vueAYvYAD ; contrôle public du 15 octobre : index-BZLuKGmv.js, V1.2.1 et messages de reprise présents ; connexion, disponibilités et manifeste HTTP 200.
- Release : https://github.com/Macor77/clementplane/releases/tag/v1.2.1
- Archive téléchargée de nouveau le 19 octobre : Clementplane_v1.2.1_Sources.zip, 517 entrées, intégrité ZIP correcte, SOURCE_COMMIT.txt conforme au tag et version 1.2.1.
- SHA256 conforme à la pièce jointe : 0f99d368b19150539d785188339de5e742aa7555aef5bc039dfdf970e6b78952.

La présente finalisation modifie uniquement CLOSURE.md et RETOUR_PILOTAGE.md, depuis l'arbre du commit tagué : code applicatif strictement identique. Les preuves de recette restent donc applicables. Le tag et son archive restent inchangés et contiennent le bilan préparatoire daté ; le bilan définitif est celui de main. Aucun nouveau déploiement applicatif ni changement de données nécessaire. Aucun e-mail envoyé. La confirmation d'Alexis reste un suivi support, sans prétendre avoir reproduit son incident Safari.
