# 2026-07-09

## Refactoring complet du module Listing

### Architecture
- Création du dossier `hooks/`
- Création des hooks :
  - `useFormateurs`
  - `useSort`
  - `useListingFilters`
  - `useDistances`
- Réorganisation des composants :
  - `components/listing`
  - `components/formateur`

### Services
Création de nouveaux services spécialisés :
- `geocodingService`
- `distanceService`
- `gpsService`

### Refactoring
- Extraction de toute la logique de géocodage hors de `Listing.jsx`
- Extraction du calcul des distances
- Extraction du chargement des formateurs
- Extraction du tri
- Extraction des filtres
- Extraction de la gestion GPS
- Simplification de la suppression des formateurs

### Résultat
- `Listing.jsx` devient une page d'orchestration.
- Les responsabilités sont réparties entre Hooks, Services et Composants.
- Architecture prête pour les futurs modules.

# CHANGELOG - TimeForma

Toutes les évolutions importantes du projet sont consignées ici.

---

## Version 0.1 — Début du projet

### Fonctionnalités

- Création des fiches formateurs
- Modification
- Suppression
- Consultation

---

## Version 0.2

### Recherche

- Recherche multicritères
- Tri des colonnes
- Filtres

---

## Version 0.3

### Cartographie

- Intégration de Leaflet
- Géolocalisation automatique
- Calcul des distances

---

## Version 0.4

### Disponibilités

- Calendrier
- Gestion des disponibilités
- Missions Alter Prévention

---

## Version 0.5

### Déploiement

- GitHub
- Vercel
- Synchronisation du projet

---

## Version 0.6 (en cours)

### Migration Supabase

- Création de la base
- Migration des données
- Stockage cloud