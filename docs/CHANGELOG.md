# CHANGELOG - TimeForma

Version : 5.2
Date : 05/08/2026

------------------------------------------------------------------------

# Sprint 6 --- Moteur de missions (Terminé)

Le Sprint 6 transforme TimeForma d'un gestionnaire de formateurs en un
véritable moteur de gestion des missions.

## Mini Sprint 6.1 --- Base de données

### Ajouts

-   Création de la table `missions`
-   Création de la table `mission_dates`
-   Création de la table `mission_formateurs`
-   Relations entre les trois tables
-   Contraintes d'intégrité
-   Préparation de l'architecture multi-organismes

------------------------------------------------------------------------

## Mini Sprint 6.2 --- Gestion des missions

### Fonctionnalités

-   Création d'une mission
-   Modification d'une mission
-   Suppression d'une mission
-   Duplication d'une mission
-   Gestion de plusieurs dates
-   Bandeau récapitulatif de la mission
-   Écran unique de gestion

------------------------------------------------------------------------

## Mini Sprint 6.3 --- Recommandation des formateurs

### Ajouts

-   Classement automatique
-   Calcul des distances
-   Filtres multicritères
-   Sélection multiple des compétences
-   Sélection multiple du matériel
-   Affichage des résultats recommandés

------------------------------------------------------------------------

## Mini Sprint 6.4 --- Workflow métier

### Nouveau cycle

Sélection → Proposition → Acceptation → Affectation

### Nouveaux statuts

-   selectionne
-   proposition_envoyee
-   accepte
-   refuse
-   affecte

### Ajouts

-   Simulation des réponses
-   Historique des dates
-   Désaffectation

------------------------------------------------------------------------

## Mini Sprint 6.5 --- Conflits et planning intelligent

### Nouveautés

-   Distinction Option / Mission
-   Confidentialité entre organismes
-   Statut `indisponible_affecte_ailleurs`
-   Retour automatique à `accepte`
-   Affectation unique par mission
-   Fusion automatique du planning

Priorité d'affichage :

1.  Mission
2.  Option
3.  Indisponible déclaré
4.  Disponible
5.  Non renseigné

------------------------------------------------------------------------

# Architecture

-   Nouvelle séparation entre disponibilités déclarées et engagements de
    mission
-   Centralisation de la logique métier dans les services
-   Calcul dynamique du planning

------------------------------------------------------------------------

# Interface

Améliorations :

-   Bandeau mission compact
-   Réorganisation des panneaux
-   Filtres multiples
-   Liste des formateurs allégée
-   Modification des missions
-   Meilleure ergonomie générale

------------------------------------------------------------------------

# Résultat

À l'issue du Sprint 6, TimeForma permet :

-   de créer une mission ;
-   de rechercher les meilleurs formateurs ;
-   de proposer une mission ;
-   de suivre les réponses ;
-   d'affecter un formateur ;
-   de sécuriser les conflits ;
-   d'afficher automatiquement les Options et les Missions dans le
    planning.

Le Sprint 6 constitue la première version opérationnelle du moteur de
missions.

------------------------------------------------------------------------

# Prochaine étape

Sprint 7 --- Tableau de bord des missions.


------------------------------------------------------------------------

# Version corrective v0.6.1

- Refonte de la page Mission.
- Consultation d'une mission sur une page dédiée.
- Filtres identiques au listing.
- Tri par proximité.
- Affichage du lieu réellement reconnu.
- Accès à la fiche formateur dans un nouvel onglet.
- Correction du calcul des distances entre le listing et les missions.


------------------------------------------------------------------------

# Sprint 7 — Vues opérationnelles des missions (Terminé)

Le Sprint 7 transforme TimeForma en un véritable outil de planification quotidien.

## Mini Sprint 7.1 — Nouvelle architecture

### Ajouts

- Nouvelle navigation (Accueil, Planning, Missions, Formateurs, Carte, Paramètres)
- Création des nouvelles pages principales
- Planning mensuel des missions
- Synthèse mensuelle
- Navigation entre les mois

------------------------------------------------------------------------

## Mini Sprint 7.2 — Polish UI

### Améliorations

- Planning compact affichable sans scroll vertical
- Déplacement des commandes du calendrier dans la colonne de droite
- Compteur du nombre de missions par journée
- Une seule étiquette affichée par cellule
- Suppression des horaires sur les étiquettes du calendrier
- Optimisation de la densité d'affichage
- Harmonisation générale de l'interface

### Missions

- « Intitulé de la mission » devient « Code interne de session »
- « Lieu » devient « Nom du site » (facultatif)
- Calcul de proximité basé exclusivement sur l'adresse, le code postal et la ville

------------------------------------------------------------------------

# Résultat

À l'issue du Sprint 7, TimeForma dispose :

- d'une navigation moderne ;
- d'un planning mensuel opérationnel ;
- d'une interface optimisée pour la planification ;
- d'une recherche géographique plus fiable grâce à l'utilisation de l'adresse structurée.

------------------------------------------------------------------------

# Prochaine étape

Sprint 8 — Comptes formateurs.
