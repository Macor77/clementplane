# ROADMAP - TimeForma

Version : 4.0
Dernière mise à jour : 14/07/2026

---

# Vision

TimeForma a pour objectif de devenir la plateforme de référence permettant aux organismes de formation de gérer, rechercher, planifier et affecter leurs formateurs.

Le développement suit trois principes :

- répondre d'abord aux besoins opérationnels d'Alter Prévention ;
- construire des fondations solides avant les fonctionnalités avancées ;
- préparer progressivement une commercialisation en SaaS.

---

# État actuel

## Sprint 1 — MVP ✅ Terminé

- Gestion des fiches formateurs
- CRUD complet
- Import CSV
- Carte Leaflet

---

## Sprint 2 — Migration Supabase ✅ Terminé

- Migration PostgreSQL
- Synchronisation Supabase
- Architecture Services
- Déploiement Vercel

---

## Sprint 3 — Disponibilités ✅ Terminé

- Calendrier individuel
- Gestion des disponibilités
- Notes multiples
- Dernière mise à jour

---

## Sprint 4 — Planning mensuel ✅ Terminé

- Planning dans le listing
- Navigation mensuelle
- Chargement optimisé
- Une seule requête Supabase

---

## Sprint 4.5 — Refactoring ✅ Terminé

- Découpage de ListingTable
- Hooks spécialisés
- Components Planning
- Architecture simplifiée

---

## Sprint 5 — Recherche & Géolocalisation ✅ Terminé

### Recherche

- ✅ Recherche multicritères
- ✅ Tri des colonnes
- ✅ Calcul des distances
- ✅ Recherche par lieu
- ✅ Recherche déclenchée par bouton
- ✅ Affichage du lieu reconnu
- ✅ Tri automatique par distance

### Géolocalisation

- ✅ Géocodage automatique
- ✅ Complétion des coordonnées GPS
- ✅ Edge Function Supabase
- ✅ Fin des appels directs à Nominatim
- ✅ Affichage du lieu reconnu

### Ergonomie

- ✅ Barre de recherche simplifiée
- ✅ Messages utilisateurs améliorés
- ✅ Boutons sécurisés pendant le calcul

---

# Sprint 6 — Gestion des missions

Objectif :

Faire de la mission le cœur de TimeForma.

## Gestion

- Création d'une mission
- Modification
- Suppression
- Affectation d'un formateur
- Client
- Formation
- Adresse
- Dates
- Horaires
- Documents

## Planning

- Passage automatique en Mission
- Détection des conflits
- Double affectation
- Synchronisation avec le planning

## Historique

- Historique des missions
- Archivage

---

# Sprint 7 — Réseau de formateurs

Objectif :

Construire progressivement le réseau propre à chaque organisme.

- Référencement
- Déréférencement
- Historique
- Recherche dans les référencés
- Recherche globale
- Détection des doublons

---

# Sprint 8 — Comptes Formateurs

Objectif :

Permettre au formateur de gérer lui-même son profil.

## Authentification

- Connexion
- Mot de passe oublié
- Revendication d'une fiche

## Profil

- Informations personnelles
- Disponibilités
- Compétences
- Secteurs
- Tarif
- Matériel

## Préférences

- Rayon d'intervention
- Types de formations
- Tarif minimum

---

# Sprint 9 — Marketplace

Objectif :

Automatiser la mise en relation.

- Publication des missions
- Recherche automatique
- Notifications
- Candidatures
- Sélection

---

# Sprint 10 — SaaS

Objectif :

Ouvrir TimeForma à plusieurs organismes.

## Multi-organismes

- Isolation complète des données
- Gestion des utilisateurs
- Gestion des rôles

## Administration

- Tableau de bord
- Paramétrage
- Statistiques

## Commercialisation

- Abonnements
- Paiements
- Facturation

---

# Idées futures

## Intelligence artificielle

- Affectation automatique des missions
- Suggestion du meilleur formateur
- Optimisation des tournées
- Prévision des disponibilités

## Mobilité

- Application mobile
- Notifications push

## Productivité

- Signature électronique
- Génération automatique des conventions
- Tableau de bord
- Statistiques avancées

---

# Philosophie

Chaque sprint doit produire une fonctionnalité immédiatement utilisable par Alter Prévention.

Le projet ne doit jamais évoluer uniquement pour des raisons techniques.

La valeur métier reste la priorité.