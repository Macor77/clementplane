# V1.2.1 — Non clôturé : validation et livraison restantes

État du 15 octobre 2026. Corrections autorisées dans la conversation « Bug Alexis Blanc Disponibilités ». Les identités et données du signalant ne sont pas utilisées dans la recette.

| Exigence | État / preuve | Environnement / reste à faire |
|---|---|---|
| Périmètre / conception | PLAN.md | Sprint correctif réseau/session |
| Développement | Page et service corrigés, refresh sans démontage de la page | Branche fix/v1.2.1-availability-recovery |
| Tests service / régression | 226 tests réussis après ajustement AuthContext (42 fichiers) ; lint des 4 fichiers applicatifs réussi | Local, API simulée |
| Navigateur desktop/mobile | Scénarios ajoutés 09-availability-recovery.spec.js | Téléchargement Chromium local échoué (archive distante invalide), exécution CI requise |
| Supabase | Pas de migration ni modification de droits | Preuve du diagnostic du 14 octobre applicable : RPC autorisés authenticated et interdits anon ; nouvelles vérifications exploitation avant livraison |
| Production | Non déployé | CI, revue, livraison et contrôle en ligne restants |
| Documentation | Plan et sections impactées mis à jour | Finaliser après recette |
| Version | package.json et lock : 1.2.1 | Vérifier affichage en ligne après livraison |
| GitHub / CI | Envoi de branche et création de PR refusés par la revue automatique : autorisation explicite de publication sur Macor77/clementplane requise | Aucune fusion ni livraison effectuée |
| Tag / archive / release | À faire après validation et livraison | Pas de tag anticipé |
| Communication | Pas d'e-mail de nouveauté proposé pour ce correctif | Aucun envoi autorisé ni effectué |
| Bilan | RETOUR_PILOTAGE.md | Non clôturé |

## Impacts et exclusions
Aucun nouveau champ, destinataire, traceur, sous-traitant, transfert, durée de conservation, rôle ou permission. Revue technique d'impact : pas de modification juridique attendue pour CGU, confidentialité, mentions légales, cookies, registre, DPA, conservation, droits et violation de données. Leur revue documentaire finale reste à terminer avant clôture ; ceci ne constitue pas un avis juridique.
Pas de cache métier persistant ni de file d'écritures hors connexion. Google Agenda inchangé. Les tests ne prouvent pas la résolution du cas réel Safari du signalant ; confirmation utilisateur non obtenue.
Rubrique Découvrir/FAQ/tutoriels : expliquer les messages de reprise avant clôture, aucune nouvelle fonction à annoncer dans les évolutions futures. Pas de promesse marketing supplémentaire.

Audit npm : aucune vulnérabilité haute/critique signalée, trois modérées à qualifier dans le suivi. Installation Chromium locale impossible (archive téléchargée invalide). CI navigateur à lancer après autorisation GitHub.
