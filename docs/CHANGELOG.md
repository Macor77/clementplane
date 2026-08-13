# CHANGELOG - Formaplane

Version : 8.0
Date : 11/08/2026

------------------------------------------------------------------------

# Sprint 6 --- Moteur de missions (Terminé)

Le Sprint 6 transforme Formaplane d'un gestionnaire de formateurs en un
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

À l'issue du Sprint 6, Formaplane permet :

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

Le Sprint 7 transforme Formaplane en un véritable outil de planification quotidien.

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

À l'issue du Sprint 7, Formaplane dispose :

- d'une navigation moderne ;
- d'un planning mensuel opérationnel ;
- d'une interface optimisée pour la planification ;
- d'une recherche géographique plus fiable grâce à l'utilisation de l'adresse structurée.

------------------------------------------------------------------------

# Prochaine étape

Sprint 8 — Comptes formateurs.
------------------------------------------------------------------------

# Sprint 8 — Comptes, espaces et collaboration multi-organismes (Terminé)

Le Sprint 8 fait évoluer Formaplane vers une véritable plateforme multi-utilisateurs et multi-organismes. Un même compte peut désormais disposer d'un espace organisme de formation, d'un espace formateur, ou des deux.

## Authentification et sécurité

- Connexion et déconnexion avec Supabase Auth.
- Création de compte organisme.
- Création de compte formateur.
- Mot de passe oublié et réinitialisation sécurisée.
- Déconnexion après modification du mot de passe.
- Affichage / masquage du mot de passe sur les formulaires concernés.
- Gestion de session et routage selon le contexte utilisateur.
- Choix de l'espace pour les utilisateurs ayant une double casquette OF + formateur.

## Espace formateur

- Revendication sécurisée d'une fiche formateur existante.
- Rattachement d'un profil formateur à un compte utilisateur sans duplication.
- Tableau de bord formateur.
- Consultation et modification du profil professionnel.
- Consultation et modification des disponibilités.
- Consultation de l'historique des disponibilités.
- Consultation des propositions de mission.
- Consultation des missions.
- Planning formateur.
- Navigation dédiée à l'espace formateur.

## Gouvernance des disponibilités

- Les disponibilités sont rattachées au profil formateur.
- Elles peuvent être modifiées depuis l'espace formateur ou depuis un organisme autorisé.
- Les modifications sont historisées.
- L'origine d'une modification est affichée de façon adaptée :
  - le formateur peut identifier l'organisme ayant effectué une modification ;
  - l'OF auteur voit « Vous » ;
  - un autre OF voit une formulation neutre afin de préserver la confidentialité.
- Les notes de disponibilité respectent également les règles de propriété et de confidentialité.

## Propositions de mission

- Un formateur peut consulter les propositions qui lui sont adressées.
- Il peut accepter ou refuser une proposition.
- Les propositions et réponses sont intégrées au workflow métier existant.
- Les propositions publiques préparées au Sprint 8.2 restent compatibles avec les formateurs non encore inscrits.

## Réseau de formateurs et multi-organismes

- Création de la relation `organization_trainers`.
- Une même fiche formateur peut être référencée par plusieurs organismes.
- Recherche globale de formateurs existants.
- Ajout d'un formateur existant au réseau d'un OF sans créer de doublon.
- Les données communes du profil restent partagées.
- Les informations propres à chaque organisme restent cloisonnées.
- Inscription d'un nouvel organisme avec création de son espace.
- Adaptation progressive des missions au fonctionnement multi-organismes.

## Confidentialité des missions externes

Correction et sécurisation du comportement lorsqu'un formateur est affecté par un autre organisme :

- l'OF propriétaire de la mission voit normalement l'état « Mission » ;
- les autres OF voient uniquement « Indisponible » ;
- aucune information sur la mission externe, son client ou l'organisme concerné n'est révélée ;
- le moteur de recommandation conserve l'information nécessaire pour empêcher les doubles affectations sans exposer les données confidentielles.

Une RPC sécurisée `get_trainer_mission_commitments_safe` fournit uniquement les informations minimales nécessaires au calcul des disponibilités.

## Validation

La batterie de tests multi-organismes a validé notamment :

- accès d'une même fiche formateur par deux OF ;
- cloisonnement des informations propres à chaque OF ;
- double casquette OF + formateur ;
- modification des disponibilités depuis l'espace formateur et visibilité côté OF ;
- propositions et réponses de mission ;
- affectation d'une mission ;
- confidentialité d'une affectation réalisée par un autre OF ;
- affichage « Indisponible » chez l'OF tiers au lieu de « En mission ».

`npm run lint` : aucune erreur bloquante, un avertissement React Hook restant dans `usePlanningAvailability.js`.

`npm run build` : build de production validé.

------------------------------------------------------------------------

# Résultat du Sprint 8

Formaplane dispose désormais des fondations nécessaires à son fonctionnement SaaS multi-organismes :

- comptes utilisateurs réels ;
- authentification ;
- espaces OF et formateur ;
- double casquette avec un compte unique ;
- profil formateur revendicable ;
- réseau de formateurs partagé sans duplication ;
- disponibilités pilotables et historisées ;
- réponses aux propositions ;
- inscription d'organismes ;
- confidentialité inter-organismes ;
- missions et indisponibilités compatibles avec plusieurs OF.

------------------------------------------------------------------------

# Prochaine étape

Sprint 9 — Notifications, relances et automatisations.
