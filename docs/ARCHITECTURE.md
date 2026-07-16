# ARCHITECTURE - TimeForma

Version : 5.0\
Dernière mise à jour : 16/07/2026\
Correspond au Sprint 6 terminé.

------------------------------------------------------------------------

# Objectif

Ce document décrit l'architecture technique de TimeForma et les
principes qui guident son évolution.

L'objectif est de conserver une architecture :

-   simple ;
-   lisible ;
-   modulaire ;
-   évolutive ;
-   adaptée à une future version SaaS.

------------------------------------------------------------------------

# Stack technique

## Frontend

-   React
-   Vite
-   JavaScript

## Backend

-   Supabase
-   PostgreSQL

## Déploiement

-   GitHub
-   GitHub Codespaces
-   Vercel

## Cartographie

-   Leaflet
-   OpenStreetMap
-   Nominatim via Edge Function

------------------------------------------------------------------------

# Architecture générale

``` text
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

Les pages orchestrent, les hooks coordonnent, les services exécutent la
logique métier et les accès aux données.

------------------------------------------------------------------------

# Organisation du projet

``` text
src/
 ├── components/
 ├── hooks/
 ├── pages/
 ├── services/
 ├── utils/
 └── lib/
```

Chaque dossier possède une responsabilité unique.

------------------------------------------------------------------------

# Architecture du moteur de missions

Le Sprint 6 introduit trois tables métier :

``` text
missions
mission_dates
mission_formateurs
```

Le moteur suit le flux :

``` text
Mission
    ↓
Recherche
    ↓
Sélection
    ↓
Proposition
    ↓
Acceptation
    ↓
Option
    ↓
Affectation
    ↓
Mission confirmée
```

------------------------------------------------------------------------

# Planning intelligent

Le planning n'est plus basé sur une seule table.

Il est calculé à partir de deux sources :

``` text
trainer_availability
        +
mission_formateurs
        +
mission_dates
```

## Rôle de chaque table

### trainer_availability

Contient uniquement les disponibilités déclarées par le formateur :

-   Disponible
-   Indisponible
-   Non renseigné
-   Notes

### mission_formateurs

Contient les états métier :

-   Sélectionné
-   Proposition envoyée
-   Accepté
-   Refusé
-   Affecté
-   indisponible_affecte_ailleurs

### mission_dates

Détermine les journées réellement concernées par les missions.

------------------------------------------------------------------------

# Fusion des données

Le planning applique la priorité suivante :

``` text
Mission
↓
Option
↓
Indisponible déclaré
↓
Disponible
↓
Non renseigné
```

Les états Option et Mission ne sont jamais enregistrés dans
`trainer_availability`.

Ils sont calculés dynamiquement.

Cette architecture évite les incohérences lors :

-   d'une suppression de mission ;
-   d'une modification de dates ;
-   d'une désaffectation.

------------------------------------------------------------------------

# Confidentialité

Le moteur est conçu pour un futur fonctionnement multi-organismes.

Par conséquent :

-   aucun OF ne voit les missions d'un autre ;
-   aucune information client n'est partagée ;
-   seuls les statuts utiles sont exposés.

------------------------------------------------------------------------

# Services principaux

-   formateursService
-   availabilityService
-   missionMatchingService
-   missionsService
-   geocodingService
-   distanceService

Toute la logique métier est centralisée dans les services.

------------------------------------------------------------------------

# Hooks principaux

-   useFormateurs
-   usePlanningAvailability
-   useListingFilters
-   useSort
-   useDistances

Les hooks orchestrent les appels aux services sans accéder directement à
Supabase.

------------------------------------------------------------------------

# Décisions structurantes

-   Une mission est indépendante d'un formateur.
-   Une option n'est pas une mission.
-   Une option ne pénalise pas les recommandations.
-   Une mission bloque automatiquement les dates concernées.
-   Une seule source de vérité est conservée pour chaque information.

------------------------------------------------------------------------

# Cycle de développement

``` text
Développement
      ↓
Tests
      ↓
Documentation
      ↓
Git Commit
      ↓
Git Push
      ↓
Vercel
      ↓
Validation
```

La documentation est considérée comme une partie intégrante du
développement.

------------------------------------------------------------------------

# Philosophie

L'architecture privilégie toujours :

-   la séparation des responsabilités ;
-   la réutilisation ;
-   la simplicité ;
-   la maintenabilité ;
-   l'évolutivité.
