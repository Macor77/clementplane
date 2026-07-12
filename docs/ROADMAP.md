La roadmap est un document vivant. Elle évolue en fonction de l'utilisation réelle de TimeForma et des besoins métier identifiés au cours du développement.

# ROADMAP - TimeForma

Version : 1.2  
Dernière mise à jour : 10/07/2026

---

# Vision

TimeForma a vocation à devenir la plateforme de référence pour la gestion des formateurs indépendants et des organismes de formation.

Le développement suit une approche pragmatique :

- développer les fonctionnalités apportant une valeur immédiate à Alter Prévention ;
- construire progressivement les fondations nécessaires à une future version SaaS ;
- faire évoluer la roadmap au fil des retours d'expérience.

---

# Sprint 1 — MVP ✅ Terminé

## Gestion des formateurs

- [x] Création d'un formateur
- [x] Modification
- [x] Suppression
- [x] Consultation

## Recherche

- [x] Recherche par nom
- [x] Recherche par ville
- [x] Recherche par département
- [x] Recherche par compétences
- [x] Recherche par matériel

## Cartographie

- [x] Carte Leaflet
- [x] Géolocalisation automatique
- [x] Calcul des distances

## Disponibilités

- [x] Calendrier
- [x] Disponible
- [x] Indisponible
- [x] Mission Alter Prévention

## Déploiement

- [x] GitHub
- [x] Vercel

---

# Sprint 2 — Migration Supabase & Architecture ✅ Terminé

## Base de données

- [x] Table Formateurs
- [x] Lecture des données
- [x] Création
- [x] Modification
- [x] Suppression
- [x] Synchronisation en ligne
- [x] Sauvegarde cloud

## Architecture

- [x] Réorganisation des dossiers
- [x] Création des Hooks
- [x] Création des Services
- [x] Refactoring complet de Listing
- [x] Documentation technique

---

# Sprint 3 — Agenda & Disponibilités 🟡 En cours

## Objectif

Construire un agenda simple et rapide à utiliser pour permettre au formateur de déclarer ses disponibilités journalières, tout en préparant l'arrivée future des missions.

## Fonctionnel

- [x] Refonte du calendrier des disponibilités
- [x] Gestion des disponibilités par journée
- [x] Statut Disponible
- [x] Statut Indisponible
- [x] Gestion simplifiée par clic successif
- [x] Suppression de la saisie manuelle du statut Mission
- [x] Ajout d'une note sur une journée
- [x] Ajout de plusieurs notes sur une même journée
- [x] Modification des notes
- [x] Suppression d'une note existante
- [x] Suppression de toutes les notes d'une journée
- [x] Affichage des notes directement dans le calendrier
- [x] Bouton Note intelligent
- [x] Affichage du nombre de notes
- [x] Fenêtre dédiée à la gestion des notes
- [x] Aide contextuelle avec exemples
- [x] Mise à jour de la légende du calendrier
- [x] Affichage de la dernière mise à jour du planning

## Modèle de disponibilité retenu

Le planning repose principalement sur une logique journalière :

- un formateur ;
- une date ;
- un statut déclaré ;
- une ou plusieurs notes éventuelles.

Le formateur déclare uniquement :

- Disponible ;
- Indisponible ;
- Non renseigné.

Une note permet d'apporter une précision sans complexifier le planning.

Exemples :

- Disponible uniquement à partir de 14 h ;
- Disponible en distanciel ;
- Préférer les missions en Île-de-France.

## Décisions préparant les missions

- [x] Le statut Mission n'est pas choisi manuellement par le formateur
- [x] Une future mission modifiera automatiquement l'affichage du planning
- [x] L'organisme propriétaire de la mission pourra voir les informations détaillées
- [x] Les autres organismes verront uniquement une indisponibilité

## À terminer

- [ ] Pousser la version validée en ligne
- [ ] Tester le calendrier en production
- [ ] Vérifier la persistance des disponibilités après actualisation
- [ ] Vérifier l'ajout, la modification et la suppression des notes en production
- [ ] Mettre à jour la documentation technique si nécessaire

---

# Sprint 4 — Refonte du Listing & Vision globale des disponibilités

## Objectif

Refondre l'affichage du listing des formateurs afin d'améliorer la lisibilité générale et permettre à un organisme de formation de comparer immédiatement les disponibilités de plusieurs formateurs.

## Refonte générale du listing

- [ ] Repenser l'organisation visuelle du listing
- [ ] Moderniser l'affichage des lignes formateurs
- [ ] Clarifier la hiérarchie des informations
- [ ] Définir les informations essentielles visibles immédiatement
- [ ] Optimiser la largeur et l'ordre des colonnes
- [ ] Réduire les informations secondaires ou les déplacer dans la fiche détaillée
- [ ] Améliorer la lisibilité sur les écrans de taille moyenne
- [ ] Préserver les filtres existants
- [ ] Préserver le tri des colonnes
- [ ] Préserver le calcul des distances
- [ ] Préserver l'accès rapide à la fiche du formateur

## Colonne Planning / Disponibilités

Une nouvelle colonne permet d'afficher le planning mensuel de chaque formateur directement dans le listing.

Le principe retenu n'est pas un mini-calendrier classique répété dans chaque ligne, mais une frise horizontale commune permettant de comparer les formateurs date par date.

### En-tête commun du planning

- [ ] Ajouter une navigation de mois commune à tout le listing
- [ ] Bouton Mois précédent
- [ ] Affichage du mois et de l'année sélectionnés
- [ ] Bouton Mois suivant
- [ ] Bouton de retour au mois en cours si nécessaire
- [ ] Le changement de mois met à jour simultanément toutes les lignes

Exemple :

```text
◀  Septembre 2026  ▶
```

### Organisation des colonnes de jours

Chaque jour du mois correspond à une colonne verticale commune à tous les formateurs.

Exemple :

```text
                 1  2  3  4  5  6  7  8  9  10 ...
Pierre Dupont    🟩 🟩 🟥 ⬜ 🟩 🟩 🟩 🟥 🟩 🟩 ...
Paul Martin      🟥 ⬜ 🟩 🟩 🟩 🟥 🟩 🟩 🟥 🟩 ...
Sophie Durand    🟩 🟩 🟩 🟩 ⬜ 🟩 🟥 🟩 🟩 🟩 ...
```

Cette présentation doit permettre de rechercher visuellement une date précise puis de descendre dans la colonne correspondante pour identifier les formateurs disponibles.

### Contenu de chaque case journalière

- [ ] Numéro du jour visible dans l'en-tête
- [ ] Couleur verte pour Disponible
- [ ] Couleur rouge pour Indisponible
- [ ] Couleur grise pour Non renseigné
- [ ] Couleur spécifique future pour Mission
- [ ] Indicateur discret lorsqu'une ou plusieurs notes existent
- [ ] Mise en évidence éventuelle du jour actuel
- [ ] Différenciation visuelle des week-ends si cela améliore la lecture

### Notes et détails

- [ ] Afficher les informations détaillées au survol d'une case
- [ ] Afficher le statut de la journée
- [ ] Afficher les notes de disponibilité
- [ ] Ne pas afficher en permanence le texte des notes dans le listing
- [ ] Éviter de surcharger visuellement les lignes

Exemple au survol :

```text
Disponible

Notes :
- Disponible uniquement après 14 h
- Préférer les missions à Paris
```

### Comparaison entre formateurs

- [ ] Aligner strictement les jours pour toutes les lignes
- [ ] Permettre la comparaison verticale sur une date précise
- [ ] Conserver le même mois pour tous les formateurs
- [ ] Rendre le planning lisible même avec plusieurs dizaines de formateurs
- [ ] Prévoir un défilement horizontal propre si nécessaire
- [ ] Étudier la possibilité de figer les informations principales du formateur pendant le défilement
- [ ] Étudier la possibilité de figer l'en-tête des jours pendant le défilement vertical

### Chargement des données

- [ ] Charger les disponibilités de tous les formateurs en une seule requête Supabase par période
- [ ] Éviter une requête distincte pour chaque formateur
- [ ] Limiter les ralentissements lorsque le listing contient de nombreux formateurs
- [ ] Mettre à jour la frise lors du changement de mois
- [ ] Gérer les erreurs de chargement sans bloquer le reste du listing

### Évolutions prévues

- [ ] Ajouter ultérieurement un filtre par date précise
- [ ] Afficher uniquement les formateurs disponibles à une date donnée
- [ ] Ajouter ultérieurement un filtre Aujourd'hui
- [ ] Ajouter ultérieurement un filtre Cette semaine
- [ ] Ajouter ultérieurement un filtre Ce mois
- [ ] Intégrer automatiquement les missions lorsque le module Missions sera disponible

---

# Sprint 5 — Gestion des missions

## Objectif

Permettre à un organisme de formation de créer et planifier ses interventions, puis mettre à jour automatiquement le planning des formateurs.

- [ ] Création d'une mission
- [ ] Modification d'une mission
- [ ] Suppression ou annulation d'une mission
- [ ] Affectation d'un formateur
- [ ] Dates et horaires de la mission
- [ ] Lieu de la mission
- [ ] Client concerné
- [ ] Type de formation
- [ ] Statut de la mission
- [ ] Passage automatique du planning en Mission
- [ ] Affichage détaillé pour l'organisme propriétaire
- [ ] Affichage Indisponible pour les autres organismes
- [ ] Historique des missions
- [ ] Documents liés à la mission
- [ ] Contrats
- [ ] Vue planning
- [ ] Détection des conflits de planning
- [ ] Prévention des doubles affectations

---

# Sprint 6 — Comptes utilisateurs

## Objectif

Permettre aux formateurs de gérer eux-mêmes leur profil et leurs disponibilités.

- [ ] Authentification
- [ ] Connexion
- [ ] Déconnexion
- [ ] Réinitialisation du mot de passe
- [ ] Revendiquer sa fiche
- [ ] Gestion du profil formateur
- [ ] Gestion du planning personnel
- [ ] Gestion des rôles
- [ ] Gestion des droits
- [ ] Sécurisation des accès

---

# Sprint 7 — Organisation

## Objectif

Ajouter les outils nécessaires au pilotage quotidien de l'activité.

- [ ] Calendrier global
- [ ] Tableau de bord
- [ ] Notifications
- [ ] Emails automatiques
- [ ] Alertes
- [ ] Rappels
- [ ] Suivi des actions importantes

---

# Sprint 8 — Version SaaS

## Objectif

Ouvrir TimeForma à plusieurs organismes de formation tout en garantissant l'isolation et la confidentialité des données.

- [ ] Multi-organismes
- [ ] Isolation des données
- [ ] Confidentialité entre organismes
- [ ] Administration
- [ ] Paramétrage des organismes
- [ ] Gestion des abonnements
- [ ] Facturation
- [ ] Paiements
- [ ] Gestion des offres commerciales

---

# Idées futures

- IA de planification
- IA d'affectation des formateurs
- Recherche automatique du meilleur formateur selon la date, la distance, les compétences et le tarif
- Application mobile
- Signature électronique
- API publique
- Tableau de bord avancé
- Statistiques d'activité
- Messagerie entre organismes et formateurs
- Notifications mobiles
- Evaluation des formateurs par les apprenants
- Gamification des foramteurs avec un suivi statistique du nombre de session, de jours, d'heures, d'apprenants etc...
