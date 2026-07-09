# ARCHITECTURE - TimeForma

Version : 1.0
Dernière mise à jour : 03/07/2026

---

# Architecture générale

TimeForma est une application web développée avec React.

L'application est hébergée sur Vercel et son code source est versionné sur GitHub.

Les données sont progressivement migrées vers Supabase.

---

# Stack technique

## Frontend

- React
- Vite
- JavaScript
- CSS

## Backend

- Supabase

## Cartographie

- Leaflet

## Hébergement

- Vercel

## Versionning

- Git
- GitHub

---

# Arborescence

```
src/

components/
pages/
services/
utils/
hooks/
assets/
```

---

# Pages principales

## Listing

Affichage de tous les formateurs.

Fonctions :

- recherche
- filtres
- tri
- distance
- carte

---

## Fiche Formateur

Permet :

- création
- modification
- consultation

---

## Calendrier

Gestion des disponibilités.

---

# Composants

Les composants réutilisables sont placés dans :

```
src/components
```

Exemples :

- SearchBar
- Filters
- FormateurCard
- DistanceBadge
- Calendar
- Map

---

# Services

Tous les accès aux données doivent être regroupés dans :

```
src/services
```

Exemple :

```
formateursService.js
```

Le reste de l'application ne devra jamais communiquer directement avec Supabase.

Cette séparation facilitera les évolutions futures.

---

# Base de données

Les données sont stockées dans Supabase.

Chaque table possède son propre service.

Exemple :

```
formateursService.js
missionsService.js
disponibilitesService.js
```

---

# Principe de développement

Chaque fonctionnalité doit respecter les règles suivantes :

- une responsabilité par composant
- code lisible
- composants réutilisables
- éviter les duplications
- privilégier la simplicité

---

# Convention de nommage

Composants :

```
FormateurCard.jsx
```

Pages :

```
Listing.jsx
```

Services :

```
formateursService.js
```

Hooks :

```
useFormateurs.js
```

---

# Objectif

L'application doit rester :

- rapide
- modulaire
- maintenable
- évolutive

Chaque nouvelle fonctionnalité devra pouvoir être ajoutée sans casser l'existant.