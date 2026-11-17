# Recette V1.7.0 — candidate

Premier candidat applicatif : `58bb5679ee855fcc460408a1fe295810adb77389`.
Quality [44098288367](https://github.com/Macor77/clementplane/actions/runs/44098288367), job 134091187875 : 424 tests unitaires/contrats et 74 parcours Chromium réussis, aucune reprise flaky. Toutes les suites SQL (missions personnelles, calendriers, revalidation, bilans/frais/présences/objectifs) passent. Audit : 10 vulnérabilités préexistantes, 1 faible et 9 modérées, aucune élevée/critique. Lint : zéro erreur, deux warnings Hooks préexistants. Build : réussi, avertissement de taille du bundle préexistant.

## Candidat applicatif final

Commit `7b65df3daaa933573d5267b8b47f6fee25c44b26` ; Quality [44100541684](https://github.com/Macor77/clementplane/actions/runs/44100541684), job 134099047400 **success** : 424 unitaires/contrats et 74 parcours navigateur passent, sans flaky, ainsi que toutes les suites SQL, lint, audit et build. Le contrôle des longs mots complète l’absence de débordement. Les commits de dossier qui suivent ne modifient pas le code testé.

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
Captures de la vraie interface avec API et données fictives. Premier examen sur mobile 320/390, détails des frais 390 et ordinateur 1440. Les grilles 320 px et tablette ont été ajustées pour éviter les mots coupés et aligner les montants. Captures finales 320/390/768/1440 px archivées ; écran tablette final et détail des frais 320 px examinés, sans anomalie bloquante. Les screenshots pleine page sont pris après retour en haut pour que le menu fixe ne masque pas une ligne intermédiaire.

## Limites et environnement
Tests navigateur avec API simulée ; PostgreSQL embarqué PGlite pour les politiques réelles. La migration locale a été testée sans changement des historiques. Le connecteur Supabase expose uniquement la production le 17 novembre : aucune migration hébergée appliquée, aucun test Auth/PostgREST réel revendiqué. Lecture de schéma en production seulement : résolution du profil formateur et politiques privées conformes au modèle testé ; table d'objectifs encore absente. Aucun téléphone physique/PWA physique testé. Aucun envoi d'e-mail ou d'événement calendrier.

## Archives et preuves

Artifact navigateur final 14336122664, ZIP vérifié SHA-256 `fc64901113e62d96cc724695eb0094509e69c85638823d1b78de5d327c13369c` ; huit captures fictives extraites dans assets/. Archive CI applicative : artifact 14335713391, ZIP sources interne SHA-256 `de012b94e1e05563f3799225cdd9b61f6b38a3fcab67d83730b05d686fd79086` (preuve journal CI). L’archive finale du dossier est régénérée depuis le commit de documentation avec scripts/testing/archive-sprint.py ; son manifeste lie chaque fichier à son checksum et son SOURCE_COMMIT au commit livré.
