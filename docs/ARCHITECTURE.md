# ARCHITECTURE - TimeForma

Version : 4.0  
Dernière mise à jour : 14/07/2026  
Correspond au Sprint 5 terminé.

---

# Objectif

Ce document décrit l'architecture technique de TimeForma.

Il précise :

- les principes de développement ;
- l'organisation du code ;
- les responsabilités des différents dossiers ;
- les flux de données ;
- les conventions de développement.

L'objectif est de garantir une architecture simple, lisible et évolutive.

---

# Stack technique

## Frontend

- React
- Vite
- JavaScript

## Backend

- Supabase
- PostgreSQL

## Déploiement

- GitHub
- Vercel

## Cartographie

- Leaflet
- OpenStreetMap
- Nominatim

## Géocodage

- Edge Function Supabase
- Nominatim appelé uniquement côté serveur

---

# Architecture générale

Le projet suit une architecture en couches.

```
Utilisateur
      │
      ▼
Pages React
      │
      ▼
Hooks
      │
      ▼
Services
      │
      ▼
Supabase
      │
      ▼
PostgreSQL
```

Les traitements externes (géocodage) transitent par une Edge Function.

```
Navigateur

      │

      ▼

Edge Function

      │

      ▼

Nominatim
```

Le navigateur ne contacte jamais directement Nominatim.

---

# Arborescence

```
src/

components/
hooks/
pages/
services/
utils/
lib/
```

Chaque dossier possède une responsabilité unique.

---

# Pages

Les pages sont uniquement des orchestrateurs.

Une page :

- récupère les hooks ;
- transmet les données aux composants ;
- gère la navigation.

Une page ne contient pas de logique métier complexe.

Exemple :

```
Listing.jsx
```

---

# Hooks

Les hooks regroupent les comportements métier.

Exemples :

```
useFormateurs

useDistances

useSort

useListingFilters

usePlanningAvailability
```

Ils encapsulent :

- les états ;
- les appels de services ;
- les traitements.

---

# Services

Les services sont les seuls responsables :

- des accès Supabase ;
- des appels réseau ;
- des traitements externes.

Exemples :

```
availabilityService

distanceService

formateursService

geocodingService

gpsService
```

Cette séparation facilite les tests et les évolutions.

---

# Components

Les composants sont responsables :

- de l'affichage ;
- des interactions utilisateur ;
- du rendu.

Ils ne doivent contenir qu'un minimum de logique métier.

---

# Edge Functions

Les Edge Functions sont stockées dans :

```
supabase/functions/
```

Aujourd'hui :

```
geocode
```

Elle est responsable de :

- recevoir une adresse ;
- interroger Nominatim ;
- renvoyer :

```
latitude

longitude

ville

département

code postal

displayName
```

---

# Flux du calcul des distances

```
Utilisateur

↓

ListingFilters

↓

useDistances

↓

geocodingService

↓

Edge Function

↓

Nominatim

↓

Coordonnées GPS

↓

distanceService

↓

Listing
```

---

# Base de données

Les accès passent exclusivement par :

```
Supabase
```

Aucun accès SQL direct depuis React.

---

# Organisation du code

Chaque nouvelle fonctionnalité doit respecter la séparation suivante.

```
Page

↓

Hook

↓

Service

↓

Supabase
```

Jamais :

```
Page

↓

Supabase
```

---

# Principes de développement

Le projet suit les règles suivantes :

- composants courts ;
- responsabilités uniques ;
- hooks spécialisés ;
- services spécialisés ;
- logique métier centralisée ;
- architecture évolutive.

---

# Refactoring

Lors d'un refactoring :

- aucun changement fonctionnel ;
- aucun changement visuel ;
- validation locale obligatoire ;
- déploiement uniquement après validation.

---

# Déploiement

Le cycle de développement est le suivant.

```
Développement local

↓

Tests

↓

Git Commit

↓

Git Push

↓

GitHub

↓

Vercel

↓

Production
```

Les Edge Functions sont déployées indépendamment.

```
npx supabase functions deploy geocode
```

---

# Philosophie

TimeForma privilégie :

- la simplicité ;
- la lisibilité ;
- la séparation des responsabilités ;
- la maintenabilité ;
- l'évolutivité.

Une architecture compréhensible est toujours préférée à une architecture complexe.