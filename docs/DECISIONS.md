# DECISIONS - TimeForma

Version : 1.0
Dernière mise à jour : 03/07/2026

---

# Décisions techniques

Ce document recense les choix techniques importants du projet et les raisons de ces choix.

---

## React

Décision

Utiliser React pour le développement de l'interface.

Pourquoi ?

- Écosystème mature
- Très grande communauté
- Composants réutilisables
- Facilité d'évolution

---

## Vite

Décision

Utiliser Vite comme outil de développement.

Pourquoi ?

- Démarrage très rapide
- Build performant
- Configuration simple

---

## GitHub

Décision

Héberger le code source sur GitHub.

Pourquoi ?

- Versionning
- Historique complet
- Travail collaboratif
- Sauvegarde du code

---

## Vercel

Décision

Déployer l'application sur Vercel.

Pourquoi ?

- Déploiement automatique
- Très bonne intégration avec GitHub
- Hébergement rapide et fiable

---

## Supabase

Décision

Utiliser Supabase comme backend principal.

Pourquoi ?

- Base PostgreSQL
- Authentification intégrée
- API automatique
- Temps réel
- Stockage de fichiers
- Évolutif vers une version SaaS

---

## Architecture par services

Décision

Tous les accès aux données passent par des fichiers `services`.

Pourquoi ?

- Séparer l'interface des données
- Faciliter les évolutions
- Simplifier les tests
- Éviter la duplication du code

---

## Philosophie

Les choix techniques doivent toujours privilégier :

- la simplicité ;
- la lisibilité ;
- la maintenabilité ;
- l'évolutivité.

Une solution simple et robuste est préférée à une solution complexe, même si elle est plus "élégante" techniquement.