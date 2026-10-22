# V1.2.3 — État de livraison

**Non clôturé — publication et recette de production en cours.** 22 octobre 2026.

| Exigence | État et preuve | Environnement / suite |
|---|---|---|
| Deux parcours, accepter/refuser | Vérifié par tests SQL exécutant les RPC existantes | PGlite local, aucune mission réelle modifiée |
| Réponse indépendante du navigateur | Trigger transactionnel testé, rollback vérifié | Local |
| Reprises et doublons | Worker simulé + claim/verrou SQL, état uncertain sans renvoi aveugle | Local ; Brevo réel non sollicité |
| Sécurité | RLS, accès tables/RPC refusés anon/authenticated, jeton de verrou | Local ; contrôles production à compléter |
| Supabase | Nouvelle migration seulement, aucune reprise de l'historique | Déploiement à faire |
| Qualité / CI | Tests, lint, audit, build en cours | CI et références à compléter |
| Production / version | Cible 1.2.3 | À vérifier |
| GitHub / tag / release / archive | Préparés dans le sprint | À publier et vérifier |
| Communication | E-mail de nouveauté inutile pour un rétablissement de comportement | Aucun envoi ni sollicitation partenaire |
| Aide / évolutions / landing | Promesses existantes déjà exactes ; aucun nouvel écran | Version affichée mise à jour, captures et tutoriels inchangés |
| Documentation | Plan, exploitation, fonctionnel, architecture, données, tests, décisions, roadmap et changelogs | Mis à jour avec le correctif |
| Pilotage | Retour à compléter à la livraison | Ne démarre aucun sprint suivant |

## Impact légal et confidentialité — revue technique
CGU : règle métier et finalité inchangées. Confidentialité publique : communications opérationnelles et prestataires déjà décrits ; pas de nouvelle catégorie ou destinataire, aucun changement nécessaire. Mentions légales et traceurs : inchangés (pas de traceur, opérateur ou stockage navigateur nouveau). Registre et politique de conservation : ajout de la file technique et de sa purge à 30 jours. Droits : ajouter la file aux recherches et à l'effacement, cascade par relation. Sous-traitants/DPA : même Supabase/Brevo, pas de nouveau contrat certifié par cette revue. Procédure de violation : cadre existant applicable, pause du worker documentée. Les réserves historiques Google Agenda restent hors périmètre et ne sont pas réputées levées.

## Portée
Les tests de transport sont simulés. Dry-run de production prévu pour authentification/configuration/lectures/rendu sans envoi ; il ne prouve pas la réception d'un nouveau mail réel. Aucun rattrapage automatique des anciennes réponses (dont le signalement initial). Les cas ambigus nécessitent réconciliation pour préserver l'absence de doublons.

## Vérifications locales — 22 octobre 2026

245 tests réussis (45 fichiers), dont 19 nouveaux tests de notifications ; suites SQL missions personnelles/versions légales/Google Agenda réussies. Lint : aucune erreur, deux avertissements préexistants (usePlanningAvailability, TrainerSearch). Audit : Vite 7.3.6 comportait une vulnérabilité high bloquant le gate ; mise à jour ciblée vers 7.3.7, aucun high/critical restant, trois moderate préexistantes Vitest/mocker/coverage hors périmètre. Build Vite/PWA réussi, avertissement habituel taille du bundle. Installation locale Chromium échouée (archive fournie tronquée) : recette navigateur requise via CI, sans prétendre à une réussite locale.

## Blocage de publication — 22 octobre 2026

Commit local applicatif : `11e12bc09436ba2a55848318001172632eec3618`. Les 32 fichiers ont été vérifiés avant publication : aucun secret ni identifiant personnel de l'incident ajouté, données de test fictives. Le dépôt a été vérifié par le connecteur : Macor77/clementplane, public, droits push/admin ; main `b245d93dc62c8b0947c2bb981c93c0f5b1d1f62c`, identique à la base locale.

Premier push refusé pour destination non vérifiée ; après vérification, nouvel essai autorisé mais échec d'authentification Git CLI. Le connecteur a créé l'arbre `1e43a99535e00e2c1f43db2195049bd6d66104eb`, puis la revue automatique a refusé la création du commit, exigeant une autorisation explicite de publication du code dans ce dépôt public. Aucun contournement effectué. Pas de branche/PR publiée, de fusion, migration, déploiement serveur, cron, tag ou release. La version en ligne est inchangée.

Action minimale : Vincent autorise explicitement la publication du correctif dans le dépôt public Macor77/clementplane ; reprendre ensuite PR/CI, livraison et clôture. La CI distante, les tests navigateur et le dry-run serveur restent à effectuer. Les contrôles locaux réussis ne sont pas présentés comme une recette de production.

## Autorisation reçue — 22 octobre 2026

Vincent a explicitement autorisé la publication du correctif dans le dépôt public Macor77/clementplane et sa mise en production après validation des contrôles restants. Le blocage précédent est levé ; reprise de la livraison.

## Correction du contrôle navigateur

La première CI PR (39737144757) passe les 245 tests, SQL, audit et build, puis échoue sur 2 des 18 tests navigateur : les missions fictives des 20/21 du mois sont passées au 22 octobre et ne figurent plus dans la prochaine mission du tableau de bord. Horloge navigateur fixée au 10 du même mois dans cette recette ; les assertions métier sont conservées. Aucun changement applicatif associé. Nouvelle CI requise.
