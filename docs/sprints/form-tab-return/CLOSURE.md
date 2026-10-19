# État du correctif — 19 octobre 2026

**Non clôturé — livraison restante.** Correction développée et vérifiée localement, publication autorisée par Vincent le 19 octobre 2026. Livraison en cours ; aucun e-mail envoyé.

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
| GitHub / CI distante | À vérifier après publication de la PR | Branche dédiée, test navigateur ajouté à Quality |
| Production, recette en ligne, version, tag, release et archive | À faire après accord de publication | Ne pas assimiler tests locaux à recette en production |

Preuves exécutables : tests/e2e/specs/10-form-tab-return.spec.js, 06-personal-missions-ui.spec.js et 09-availability-recovery.spec.js. Les événements de visibilité sont synthétiques et transitent par le vrai SDK. Aucun contournement de l'authentification en production.
