# Recette V1.7.0 — candidate

Premier candidat applicatif : `58bb5679ee855fcc460408a1fe295810adb77389`.
Quality [44098288367](https://github.com/Macor77/clementplane/actions/runs/44098288367), job 134091187875 : 424 tests unitaires/contrats et 74 parcours Chromium réussis, aucune reprise flaky. Toutes les suites SQL (missions personnelles, calendriers, revalidation, bilans/frais/présences/objectifs) passent. Audit : 10 vulnérabilités préexistantes, 1 faible et 9 modérées, aucune élevée/critique. Lint : zéro erreur, deux warnings Hooks préexistants. Build : réussi, avertissement de taille du bundle préexistant.

## Périmètre couvert
- CA réalisé HT/TTC, zéro, montant absent, frais exacts et catégories répétées, archives non dupliquées.
- Historiques conservés, date d'ancrage à cheval sur deux périodes, distinction des participations complètes/partielles.
- Périodes rapides, comparaison des jours écoulés, filtres et listes de détail.
- Aides au toucher, Escape, retour du focus, absence de débordement horizontal en 320/390/768/1440 px.
- Fin de session et raisons dans À compléter, cinq lignes et Tout voir.
- Objectif : sauvegarde, erreur avec saisie conservée, rechargement, suppression, indépendance des filtres.
- Échec de lecture privée : aucun faux zéro ; retry récupère les données.
- RLS objectifs : propriétaire, autre formateur, OF, anonyme, falsification du propriétaire, contraintes et cascade.

## Examen visuel
Captures de la vraie interface avec API et données fictives. Premier examen sur mobile 320/390, détails des frais 390 et ordinateur 1440. Un ajustement de grille 320 px évite les mots coupés et aligne mieux les montants ; captures finales à recontrôler. Les screenshots pleine page sont pris après retour en haut pour que le menu fixe ne masque pas une ligne intermédiaire.

## Limites et environnement
Tests navigateur avec API simulée ; PostgreSQL embarqué PGlite pour les politiques réelles. Le connecteur Supabase expose uniquement la production le 17 novembre : aucune migration hébergée appliquée, aucun test Auth/PostgREST réel revendiqué. Lecture de schéma en production seulement : résolution du profil formateur et politiques privées conformes au modèle testé ; table d'objectifs encore absente. Aucun téléphone physique/PWA physique testé. Aucun envoi d'e-mail ou d'événement calendrier.
