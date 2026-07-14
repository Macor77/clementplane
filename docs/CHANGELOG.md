# CHANGELOG - TimeForma

Toutes les évolutions importantes du projet sont consignées dans ce document.

---

# Version 4.0 — 14/07/2026

Correspond au **Sprint 5 terminé**.

## Recherche

- Recherche multicritères stabilisée
- Recherche géographique par ville
- Déclenchement manuel du calcul des distances
- Tri automatique par distance

## Géolocalisation

- Création de l'Edge Function `geocode`
- Suppression des appels directs à Nominatim
- Complétion automatique des coordonnées GPS
- Affichage du lieu reconnu
- Affichage du département et du code postal

## Architecture

- Stabilisation de l'architecture Hooks / Services
- Simplification de `Listing.jsx`
- Finalisation du module `useDistances`
- Documentation technique complète

## Déploiement

- Déploiement Vercel
- Déploiement de l'Edge Function Supabase

---

# Version 3.0 — 13/07/2026

Correspond aux **Sprints 3, 4 et 4.5**.

## Planning

- Planning mensuel intégré au listing
- Navigation entre les mois
- Légende
- En-tête fixe
- Comparaison de tous les formateurs sur une même période

## Disponibilités

- Notes multiples
- Dernière mise à jour
- Une seule requête Supabase pour charger un mois complet

## Architecture

- Refactoring complet de `ListingTable`
- Création des composants du planning
- Création des hooks spécialisés

---

# Version 2.0

Correspond au passage à Supabase.

## Backend

- Migration PostgreSQL
- Synchronisation Supabase
- Déploiement Vercel

## Architecture

- Création des services
- Centralisation des accès aux données

---

# Version 1.0

Première version opérationnelle.

## Fonctionnalités

- Gestion des formateurs
- CRUD complet
- Import CSV
- Carte Leaflet
- Calcul initial des distances

---

# Règles

Chaque version majeure doit être publiée lorsque :

- un sprint important est terminé ;
- le code est déployé en production ;
- la documentation est mise à jour ;
- la roadmap est synchronisée.

Le CHANGELOG constitue l'historique officiel du projet.