# ARCHITECTURE - TimeForma

Version : 1.1  
Dernière mise à jour : 09/07/2026

---

# Architecture générale

TimeForma est une application web développée avec React et Vite.

L'application est hébergée sur Vercel et son code source est versionné sur GitHub.

Les données sont stockées progressivement dans Supabase.

L'architecture actuelle repose sur une séparation claire entre :

- les pages ;
- les composants ;
- les hooks ;
- les services ;
- les utilitaires ;
- la configuration externe.

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
- Nominatim / OpenStreetMap pour le géocodage

## Hébergement

- Vercel

## Versionning

- Git
- GitHub

---

# Arborescence actuelle

```txt
src/
│
├── assets/
│
├── components/
│   ├── listing/
│   │   ├── ListingFilters.jsx
│   │   ├── ListingHeader.jsx
│   │   ├── ListingTable.jsx
│   │   └── SortHeader.jsx
│   │
│   └── formateur/
│       └── AvailabilityCalendar.jsx
│
├── hooks/
│   ├── useFormateurs.js
│   ├── useSort.js
│   ├── useListingFilters.js
│   └── useDistances.js
│
├── pages/
│   ├── Listing.jsx
│   ├── FormateurForm.jsx
│   ├── FormateurView.jsx
│   ├── EnvCheck.jsx
│   └── MigrateLocal.jsx
│
├── services/
│   ├── formateursService.js
│   ├── geocodingService.js
│   ├── distanceService.js
│   └── gpsService.js
│
├── utils/
│
├── lib/
│   └── supabaseClient.js
│
├── App.jsx
├── main.jsx
├── ErrorBoundary.jsx
├── App.css
└── index.css