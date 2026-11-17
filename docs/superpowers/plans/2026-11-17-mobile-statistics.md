# V1.7.0 — Statistiques formateur sur mobile

## Goal / validation
Le 17 novembre 2026, Vincent valide les améliorations proposées et autorise leur développement. Le CA représente les formations réalisées, pas les encaissements. Nouvelle production non autorisée à ce stade.

## Architecture / stack
React/Vite existant, services Supabase paginés, calculs purs testés, dialogues natifs. Aucune dépendance supplémentaire. Réutiliser calculateActivity pour les règles historiques et ActivityHelp pour les explications.

## Spec et règles de calcul
- Périodes rapides, filtres OF/formation repliés, chiffres avec détails, aides au toucher, graphique et comparaison, objectif mensuel facultatif.
- CA : montant déclaré du bilan réalisé ou partiellement réalisé, une fois à sa date d'activité. HT/TTC séparés. Aucun montant convenu substitué automatiquement. Une réalisation partielle utilise le montant déclaré pour cette réalisation ; aide explicite. Montants absents visibles et cliquables.
- Frais : dépenses privées déclarées, sans addition des archives migrées. Montants en centimes. Rattachement à la date d'activité ou première référence de la mission, faute de date de dépense. Inclut les frais saisis sur les missions non réalisées ; jamais une estimation ni des indemnités kilométriques. Date future exclue de l'activité passée. Liste vide signifie aucun frais déclaré, pas une confirmation de zéro frais réel.
- Bilans historiques conservés, effectifs complets et partiels séparés ; aucune modification de la saisie ou des politiques existantes.
- Les périodes à venir ne sont pas du CA réalisé. Comparaisons sur périodes écoulées équivalentes (jour du mois/année, durée pour période personnalisée), sans pourcentage si base zéro.
- Les barres de sessions sont ancrées à la première réalisation de chaque groupe historique pour éviter le double comptage dans le graphique. Le total existant de période conserve ses règles de comptage.
- Objectif privé unique par mois : sessions, jours ou CA HT/TTC ; calcul sur toutes les missions du mois, indépendamment des filtres du tableau. Montants en euros, validation décimale ; pourcentage plafonné visuellement mais valeur réelle conservée.
- À compléter : fin de session, donneur d'ordre et raison courte ; accès au bilan ; liste initialement limitée à cinq lignes.

## Global constraints / review focus
Confidentialité propriétaire à tous les étages. Ne jamais charger difficultés ou kilomètres pour ces statistiques. Aucun envoi d'agenda/e-mail. Filtrage serveur et RLS. Échec réseau ne doit pas afficher un faux zéro ni des données d'un ancien compte. Les objectifs sont la seule nouvelle table, migration additive sans traitement des données existantes. Pas de production ni de changement des dépendances.

## Execution ledger
1. Isolation et baseline : worktree feature/v1.7.0-mobile-statistics depuis 185e8e8 ; 413 tests passent.
2. Tests et utilitaires/services : réalisés ; 424 unitaires/contrats et toutes les suites activity SQL réussis.
3. Interface mobile, détails, graphiques, aides : réalisés ; 74 parcours navigateur réussis au premier candidat. Ajustement visuel 320 px en vérification.
4. Objectif privé et migration : réalisés, RLS PGlite vérifiée. Projet de démonstration non exposé par le connecteur actuel ; migration hébergée non appliquée. Schéma et politiques de production inspectés en lecture seule.
5. Revue indépendante terminée, défaut de retry objectif corrigé ; suite finale sur dernier commit requise.
6. PR brouillon #28 créée ; documentation actualisée ; archive candidate CI à vérifier après contrôle final.

Exécution native, une revue indépendante finale. Ledger manuel (outils de suivi du skill non exposés dans cet environnement). Les choix de périmètre ci-dessus appliquent la validation existante sans nouvelle boucle de confirmation.
