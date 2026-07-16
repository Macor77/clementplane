# CHANGELOG - TimeForma

Version : 5.0 Date : 16/07/2026

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
