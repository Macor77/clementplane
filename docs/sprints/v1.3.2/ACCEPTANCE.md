# Recette V1.3.2

Base `a339c4a`, code candidat `d8033df7f9232b9ed37e136590a5a7a04ffd1247`, [PR #23](https://github.com/Macor77/clementplane/pull/23). Exécutée le 14 novembre 2026.

| Cas | Preuve |
|---|---|
| Un groupe, titre sans saisie, pas de champs prévisionnels | Formulaire et service ; tests navigateur bureau/mobile réussis |
| 0,5 jour et 3 h indépendants, zéro distinct d’inconnu | Tests Vitest et PGlite ; PostgreSQL de recette |
| Titre, dates et rattachement non falsifiables | PGlite + PostgreSQL hébergé : rejet des clés client interdites |
| Bilans historiques sans perte | PGlite : sessions inchangées après migration/conversion ; plusieurs groupes non fusionnables ; seuls effectifs et réalisations corrigeables |
| Ancienne PWA | Rejet des créations détaillées et des écrasements d’un bilan simple ; restriction documentée |
| Répartition par période | Vitest : totaux simples ancrés une seule fois, absence de double comptage des détails archivés, historique par journée préservé |
| Reprogrammation | PGlite : brouillon futur replanifié dans le passé puis réalisé ; frontend aligne la condition d’accès avec le serveur |
| Première date historique corrigée | PGlite : correction du premier jour réalisé avant conversion, nouvel ancrage pris en compte |
| Privé / partagé | RLS owner/OF/autre OF/autre formateur/anon ; champs privés absents de l’enveloppe partagée, OF sans écriture |
| Fiabilité | PGlite : sauvegarde atomique, reprise idempotente, contrôle de révision ; erreur réseau, retour de focus et rechargement navigateur réussis |
| Régression | Quality inclut tests unitaires, anciens SQL/RLS, calendriers, PWA et parcours navigateur existants |

## PostgreSQL hébergé
Branche de recette non par défaut `documentation-demo` / `jqhbrkyeawtsuzrzrnvm` vérifiée. Migration additive appliquée sous la version hébergée `20261114195629` (source `20261114194307_simplify_trainer_activity.sql`). `scripts/testing/simple-activity-staging.sql` exécuté avec succès : formation et dates serveur, demi-journée, rejet ancien client, reprise, confidentialité et droits. Transaction annulée ; vérification après recette : **0 utilisateur fictif aaa13200 restant**. Aucune migration ou saisie en production.

## Revue indépendante
Quatre points relevés : dates d’un brouillon reprogrammé, ancrage après correction historique, intitulés historiques masqués, version affichée. Corrigés et couverts par tests. Une seconde vérification a aligné précisément les conditions de rafraîchissement client/serveur (mission personnelle accessible ou OF confirmé, hors bilan conservé). Contre-revue finale sans blocage.

## Exécution locale
Tests ciblés : 29 réussis. Quality sur le commit applicatif : **367 tests unitaires et 49 parcours navigateur réussis**. Lint sans erreur, deux avertissements préexistants hors périmètre. Build réussi, avertissement historique de taille de bundle. Quality [43634769301](https://github.com/Macor77/clementplane/actions/runs/43634769301) réussie : tous les SQL/RLS, audit, build, tests navigateur et archive. Dépendances : 12 vulnérabilités existantes (3 faibles, 9 modérées), aucune haute/critique.

Les six captures fictives ont été téléchargées et relues : formulaire 1440 px / 390 px, statistiques aux deux formats, OF en lecture seule, groupes historiques. Champs lisibles, aucun débordement mobile. Les captures pleine page montrent la barre d’enregistrement fixe du bureau à la position du viewport ; le mobile utilise une barre normale. Artefact browser-acceptance du run, conservation 7 jours.

Archive candidate téléchargée, ZIP et chaque empreinte du manifeste vérifiés : 638 entrées, commit de fusion de recette `0e1d67265ec054e27f22ba7501282c92f6fbbe21` (arbre identique au candidat applicatif d8033df7), SHA-256 `e14fc1355b0f7785c16c3e838806e71a5f0345bbbb6874a949813629cc8fa4a7`. L’ajout de ce dossier de preuves entraînera une nouvelle archive sur le dernier commit documentaire ; consulter l’artefact v1.3.2-source-candidate de la dernière Quality de PR. Cette archive ne constitue pas une publication en production.
