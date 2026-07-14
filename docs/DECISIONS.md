# DECISIONS - TimeForma

Version : 4.0  
Dernière mise à jour : 14/07/2026  
Correspond au Sprint 5 terminé.

---

# Objectif

Ce document recense les décisions structurantes prises au cours du développement de TimeForma.

Il ne décrit pas **ce qui a été développé**, mais **pourquoi** certains choix ont été retenus.

---

# Principes généraux

Les décisions techniques sont guidées par cinq principes :

- Simplicité
- Lisibilité
- Évolutivité
- Performance
- Valeur métier

Une solution plus simple est toujours préférée à une solution plus complexe lorsqu'elle répond au besoin.

---

# Architecture React

## Pages = orchestration

Les pages React ne contiennent pas la logique métier.

Elles orchestrent uniquement :

- les hooks ;
- les composants ;
- la navigation.

Pourquoi ?

- composants plus petits ;
- logique réutilisable ;
- maintenance facilitée.

---

## Hooks = logique métier

Toute logique réutilisable est placée dans un hook.

Exemples :

- useDistances
- useListingFilters
- usePlanningAvailability
- useSort

Pourquoi ?

- séparation des responsabilités ;
- meilleure lisibilité ;
- tests facilités.

---

## Services = accès aux données

Tous les accès externes passent par les services.

Jamais directement depuis un composant.

Les services regroupent :

- Supabase
- géocodage
- calcul des distances
- GPS

---

# Supabase

Supabase est le backend officiel de TimeForma.

Pourquoi ?

- PostgreSQL
- Authentification
- API automatique
- Edge Functions
- évolutivité SaaS

---

# Géocodage

## Décision

Le navigateur n'appelle jamais directement Nominatim.

Le géocodage passe obligatoirement par une Edge Function.

```
Navigateur

↓

Edge Function

↓

Nominatim
```

Pourquoi ?

- éviter les blocages CORS ;
- masquer la logique côté serveur ;
- pouvoir changer facilement de fournisseur de géocodage ;
- centraliser les traitements.

---

# Recherche de proximité

Le calcul des distances est lancé uniquement lorsque l'utilisateur clique sur le bouton.

Pourquoi ?

Les recherches automatiques provoquaient :

- trop de requêtes ;
- une mauvaise expérience utilisateur ;
- des erreurs de géocodage.

---

# Lieu reconnu

Après chaque recherche, TimeForma affiche :

```
📍 Lieu reconnu

Chelles, Seine-et-Marne (77500)
```

Pourquoi ?

- rassurer l'utilisateur ;
- détecter immédiatement une mauvaise commune ;
- éviter les erreurs liées aux homonymes.

---

# Planning

Le planning est commun à tous les formateurs.

Pourquoi ?

Comparer plusieurs formateurs est plus important que consulter plusieurs calendriers indépendants.

---

# Disponibilités

Les disponibilités sont journalières.

Pourquoi ?

Une granularité horaire compliquerait inutilement le produit.

Les horaires seront portés par les futures missions.

---

# Mission

Une mission n'est jamais saisie manuellement dans le planning.

Elle sera générée automatiquement par le module Missions.

Pourquoi ?

Une mission est une conséquence de l'affectation.

Ce n'est pas une disponibilité.

---

# Refactoring

Un refactoring ne doit jamais modifier :

- le comportement ;
- l'interface ;
- les données.

Son objectif est uniquement d'améliorer le code.

---

# Déploiement

Aucun développement n'est considéré terminé tant que :

- les tests locaux sont validés ;
- GitHub est synchronisé ;
- Vercel est déployé ;
- la documentation est mise à jour.

---

# Documentation

La documentation fait partie intégrante du projet.

Chaque sprint important doit entraîner une mise à jour :

- README
- ROADMAP
- CHANGELOG
- ARCHITECTURE
- DECISIONS

---

# Philosophie

TimeForma est développé comme un produit.

Chaque évolution doit apporter une valeur immédiate aux organismes de formation tout en préparant progressivement la future plateforme SaaS.