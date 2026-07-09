# PRD - TimeForma

Version : 1.0
Dernière mise à jour : 03/07/2026

---

# 1. Présentation

TimeForma est une plateforme de gestion de formateurs créée par Alter Prévention.

L'objectif est de permettre à un organisme de formation de gérer simplement l'ensemble de ses formateurs, leurs compétences, leurs disponibilités, leurs coordonnées et leur affectation aux missions.

À terme, TimeForma deviendra une plateforme SaaS accessible à plusieurs organismes de formation.

---

# 2. Objectifs

Les objectifs principaux sont :

- Centraliser les informations des formateurs
- Trouver rapidement le meilleur formateur pour une mission
- Gérer les disponibilités
- Visualiser les distances entre les formateurs et les lieux de mission
- Simplifier l'organisation des formations
- Réduire le temps administratif

---

# 3. Public visé

Aujourd'hui :

- Alter Prévention

À terme :

- Organismes de formation
- Responsables pédagogiques
- Planificateurs
- Assistantes administratives

---

# 4. Fonctionnalités actuelles

## Gestion des formateurs

- création
- modification
- suppression
- consultation

Chaque fiche contient notamment :

- identité
- coordonnées
- adresse
- ville
- code postal
- email
- téléphone
- compétences
- matériel
- tarif
- statut
- notes
- géolocalisation
- dernière mise à jour

---

## Recherche

Recherche par :

- nom
- ville
- département
- compétences
- matériel
- statut

---

## Distances

Calcul automatique de la distance entre :

- un lieu de formation
- chaque formateur

Classement par proximité.

---

## Carte

Affichage Leaflet.

Visualisation des formateurs sur une carte.

---

## Disponibilités

Calendrier permettant d'indiquer :

- Disponible
- Indisponible
- Mission Alter Prévention

---

# 5. Fonctionnalités prévues

## Priorité élevée

- Migration complète vers Supabase
- Authentification
- Sauvegarde cloud
- Comptes utilisateurs
- Synchronisation temps réel

## Priorité moyenne

- Gestion des missions
- Génération automatique de contrats
- Historique des missions
- Documents des formateurs
- Notifications

## Priorité faible

- Application mobile
- Version multi-organismes
- Marketplace de formateurs
- IA d'aide à la planification

---

# 6. Technologies

Frontend :

- React
- Vite

Backend :

- Supabase

Cartographie :

- Leaflet

Déploiement :

- GitHub
- Vercel

---

# 7. Philosophie du projet

TimeForma doit rester :

- simple
- rapide
- moderne
- agréable
- intuitif

Le logiciel doit privilégier la rapidité d'utilisation plutôt que la complexité.

Chaque nouvelle fonctionnalité devra améliorer l'expérience utilisateur sans alourdir l'interface.