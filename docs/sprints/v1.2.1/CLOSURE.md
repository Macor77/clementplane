# V1.2.1 — Non clôturé : validation et livraison restantes

État du 15 octobre 2026. Corrections réseau/session autorisées dans la conversation de suivi du signalement. Les identités et données du signalant ne sont pas utilisées dans la recette.

| Exigence | État / preuve | Environnement / reste à faire |
|---|---|---|
| Périmètre / conception | PLAN.md | Sprint correctif réseau/session |
| Développement | Page et service corrigés, refresh sans démontage de la page | Branche fix/v1.2.1-availability-recovery |
| Tests service / régression | 226 tests réussis après ajustement AuthContext (42 fichiers) ; lint des 4 fichiers applicatifs réussi | Local, API simulée |
| Navigateur desktop/mobile | Scénarios ajoutés 09-availability-recovery.spec.js | CI Quality #105 réussie : 14 tests navigateur dont reprise réseau en 1440/390 px et renouvellement 401. API simulée, Chromium ; pas de test sur Safari réel ni PWA installée sur appareil physique. |
| Supabase | Pas de migration ni modification de droits | Preuve du diagnostic du 14 octobre applicable : RPC autorisés authenticated et interdits anon ; nouvelles vérifications exploitation avant livraison |
| Production | Non déployé | Livraison, contrôle en ligne et clôture restants ; CI verte |
| Documentation | Plan et sections impactées mis à jour | Finaliser après recette |
| Version | package.json et lock : 1.2.1 | Vérifier affichage en ligne après livraison |
| GitHub / CI | Publication explicitement autorisée le 15 octobre : PR #12 créée en brouillon ; commit 98d8be9308f4505a0093ebaa0af402c945a14108 | Aucune fusion ni livraison effectuée |
| Tag / archive / release | À faire après validation et livraison | Pas de tag anticipé |
| Communication | Pas d'e-mail de nouveauté proposé pour ce correctif | Aucun envoi autorisé ni effectué |
| Bilan | RETOUR_PILOTAGE.md | Non clôturé |

## Impacts et exclusions
Aucun nouveau champ, destinataire, traceur, sous-traitant, transfert, durée de conservation, rôle ou permission. Revue technique d'impact : pas de modification juridique attendue pour CGU, confidentialité, mentions légales, cookies, registre, DPA, conservation, droits et violation de données. Documents consultés le 15 octobre : src/pages/LegalPage.jsx et docs/rgpd/*.md. CGU : aucun nouvel engagement ; confidentialité et registre : mêmes données/finalités ; mentions : même exploitant/hébergeur ; traceurs : aucune nouvelle persistance ; sous-traitants/DPA : aucun nouveau prestataire ni flux ; conservation : mêmes durées ; droits et violation : mêmes procédures. Aucune modification nécessaire pour ce correctif. Les contrats externes ne sont pas certifiés par cette revue technique.
Pas de cache métier persistant ni de file d'écritures hors connexion. Google Agenda inchangé. Les tests ne prouvent pas la résolution du cas réel Safari du signalant ; confirmation utilisateur non obtenue.
Rubrique Découvrir : conseil du tutoriel disponibilités actualisé pour expliquer confirmation et reprise. Captures de parcours existantes inchangées : même procédure nominale. Évolutions futures et landing inchangées : aucune nouvelle fonction ni promesse commerciale.

Audit npm : aucune vulnérabilité haute/critique signalée, trois modérées à qualifier dans le suivi. Installation Chromium locale impossible (archive téléchargée invalide). CI Quality #105 réussie sur 98d8be9308f4505a0093ebaa0af402c945a14108. Artefact browser-acceptance 11970790630, SHA256 6da3bf07e917e3f0305431c3ac105e3b36cc78486f24993e9e550970315c0350, rétention 7 jours. Les alertes modérées concernent Vitest/@vitest/mocker/coverage-v8 (outillage de test, pas de code de production ajouté).

## Validation de livraison préparée

Version 1.2.1 prête pour validation de publication après complément pédagogique. CI #105 : tests, SQL/RLS, sécurité calendrier, audit, compilation et 14 scénarios navigateur réussis. Complément suivant limité au texte du tutoriel et au bilan ; 2 tests de contenu réussis en local. Ni fusion, ni tag, ni déploiement annoncés comme effectués.
