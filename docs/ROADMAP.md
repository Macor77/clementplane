La roadmap est un document vivant. Elle évolue en fonction de l'utilisation réelle de TimeForma et des besoins métier identifiés au cours du développement.
ROADMAP - TimeForma
Version : 2.0  
Dernière mise à jour : 12/07/2026
---
Vision
TimeForma a vocation à devenir la plateforme de référence pour la gestion des formateurs indépendants et des organismes de formation.
Le développement suit une approche pragmatique :
développer les fonctionnalités apportant une valeur immédiate à Alter Prévention ;
construire progressivement les fondations nécessaires à une future version SaaS ;
faire évoluer la roadmap au fil des retours d'expérience.
---
Sprint 1 — MVP ✅ Terminé
Gestion des formateurs
[x] Création d'un formateur
[x] Modification d'un formateur
[x] Suppression d'un formateur
[x] Consultation d'une fiche formateur
Recherche
[x] Recherche par nom
[x] Recherche par ville
[x] Recherche par département
[x] Recherche par compétences
[x] Recherche par matériel
Cartographie
[x] Carte Leaflet
[x] Géolocalisation automatique
[x] Calcul des distances
Disponibilités
[x] Calendrier
[x] Statut Disponible
[x] Statut Indisponible
[x] Statut Mission Alter Prévention
Déploiement
[x] Hébergement du code sur GitHub
[x] Déploiement sur Vercel
---
Sprint 2 — Migration Supabase & Architecture ✅ Terminé
Base de données
[x] Création de la table Formateurs
[x] Lecture des données
[x] Création des données
[x] Modification des données
[x] Suppression des données
[x] Synchronisation en ligne
[x] Sauvegarde cloud
Architecture
[x] Réorganisation des dossiers
[x] Création des hooks
[x] Création des services
[x] Refactoring complet de Listing
[x] Documentation technique
---
Sprint 3 — Agenda & Disponibilités ✅ Terminé
Objectif
Construire un agenda simple et rapide à utiliser pour permettre au formateur de déclarer ses disponibilités journalières, tout en préparant l'arrivée future des missions.
Fonctionnel
[x] Refonte du calendrier des disponibilités
[x] Gestion des disponibilités par journée
[x] Statut Disponible
[x] Statut Indisponible
[x] Statut Non renseigné
[x] Gestion simplifiée par clic successif
[x] Suppression de la saisie manuelle du statut Mission
[x] Ajout d'une note sur une journée
[x] Ajout de plusieurs notes sur une même journée
[x] Modification des notes
[x] Suppression d'une note existante
[x] Suppression de toutes les notes d'une journée
[x] Affichage des notes dans le calendrier
[x] Bouton Note intelligent
[x] Affichage du nombre de notes
[x] Fenêtre dédiée à la gestion des notes
[x] Aide contextuelle avec exemples
[x] Mise à jour de la légende du calendrier
[x] Affichage de la dernière mise à jour du planning
[x] Déploiement en production
[x] Validation du fonctionnement en production
Modèle de disponibilité retenu
Le planning repose sur une logique journalière :
un formateur ;
une date ;
un statut déclaré ;
une ou plusieurs notes éventuelles.
Le formateur déclare uniquement :
Disponible ;
Indisponible ;
Non renseigné.
Une note permet d'apporter une précision sans complexifier le planning.
Exemples :
Disponible uniquement à partir de 14 h ;
Disponible en distanciel ;
Préférer les missions en Île-de-France.
Préparation du module Missions
[x] Le statut Mission n'est pas choisi manuellement par le formateur
[x] Une future mission modifiera automatiquement l'affichage du planning
[x] L'organisme propriétaire de la mission pourra voir les informations détaillées
[x] Les autres organismes verront uniquement une indisponibilité
---
Sprint 4 — Refonte du Listing & Vision globale des disponibilités ✅ Terminé
Objectif
Transformer le listing des formateurs en véritable outil de pilotage des disponibilités.
Refonte visuelle
[x] Réorganisation complète du listing
[x] Regroupement du prénom et du nom dans une colonne Formateur
[x] Regroupement de la ville et du code postal dans une colonne Localisation
[x] Déplacement des actions sous le nom du formateur
[x] Suppression de la colonne Actions dédiée
[x] Optimisation des largeurs de colonnes
[x] Nouvelle hiérarchie visuelle
[x] Amélioration de la lisibilité générale
[x] Préservation des filtres existants
[x] Préservation du tri des colonnes
[x] Préservation du calcul des distances
[x] Préservation de l'accès rapide à la fiche du formateur
Planning intégré au listing
[x] Création d'une colonne Planning
[x] Affichage d'une frise horizontale mensuelle
[x] Navigation vers le mois précédent
[x] Navigation vers le mois suivant
[x] Retour au mois courant
[x] Changement de mois commun à tous les formateurs
[x] Alignement vertical strict des jours
[x] Affichage des numéros de jours dans l'en-tête
[x] Couleur verte pour Disponible
[x] Couleur rouge pour Indisponible
[x] Couleur grise pour Non renseigné
[x] Couleur spécifique pour Mission
[x] Mise en évidence du jour actuel
[x] Indicateur visuel lorsqu'une note est présente
[x] Affichage du statut et des notes au survol
[x] Légende des couleurs
[x] En-tête fixe pendant le défilement vertical
[x] Maintien visible du mois et de l'alignement des jours
[x] Adaptation de la largeur du planning à l'écran
Chargement des données
[x] Chargement des disponibilités de tous les formateurs en une seule requête Supabase
[x] Évitement d'une requête distincte par formateur
[x] Mise à jour automatique lors du changement de mois
[x] Gestion de l'état de chargement
[x] Gestion des erreurs de chargement
[x] Déploiement en production
[x] Validation du fonctionnement en production
---
Sprint 4.5 — Refactoring du Listing ✅ Terminé
Objectif
Découper `ListingTable.jsx` afin d'améliorer la lisibilité, la maintenance et l'évolutivité du code, sans modifier le comportement actuel.
Découpage cible
[x] Réduire la taille de `ListingTable.jsx`
[x] Créer `PlanningHeader.jsx`
[x] Créer `PlanningRow.jsx`
[x] Créer `PlanningCell.jsx`
[x] Créer `PlanningLegend.jsx`
[x] Créer `planningUtils.js`
Répartition attendue
`ListingTable.jsx`
structure générale du tableau ;
boucle sur les formateurs ;
assemblage des sous-composants.
`PlanningHeader.jsx`
affichage du mois ;
boutons de navigation ;
retour au mois courant ;
numéros des jours ;
état de chargement ;
message d'erreur.
`PlanningRow.jsx`
affichage de la frise mensuelle d'un formateur ;
récupération des disponibilités du formateur ;
création des cellules journalières.
`PlanningCell.jsx`
affichage de la couleur ;
affichage de l'indicateur de note ;
mise en évidence du jour actuel ;
info-bulle au survol.
`PlanningLegend.jsx`
légende des statuts ;
indicateur de note.
`planningUtils.js`
calcul des jours du mois ;
formatage des dates ;
gestion des statuts ;
gestion des couleurs ;
gestion des notes ;
construction des info-bulles.
Contraintes
[x] Aucun changement visuel
[x] Aucun changement fonctionnel
[ ] Même rendu
[ ] Même performance
[ ] Aucun changement de données
[ ] Aucun changement Supabase
[ ] Tests après chaque extraction
[ ] Validation complète avant déploiement
[ ] Déploiement en production après validation
---
Sprint 5 — Recherche & Ergonomie ⚪ À venir
Objectif
Exploiter le planning intégré au listing pour accélérer la recherche de formateurs et améliorer le confort d'utilisation.
Recherche
[ ] Filtre Disponible le
[ ] Filtre Disponible aujourd'hui
[ ] Filtre Disponible cette semaine
[ ] Filtre Disponible ce mois
[ ] Filtre par période
[ ] Recherche multicritères
[ ] Combinaison compétence, lieu, distance et disponibilité
[ ] Affichage uniquement des formateurs disponibles à une date donnée
Ergonomie
[ ] Modernisation de la barre de filtres
[ ] Réorganisation visuelle des filtres
[ ] Réinitialisation rapide des filtres
[ ] Colonnes masquables
[ ] Sauvegarde des préférences d'affichage
[ ] Mise en valeur des formateurs Premium
[ ] Optimisation pour les écrans larges
[ ] Amélioration de l'affichage sur les écrans de taille moyenne
[ ] Conservation d'une lecture rapide du planning
---
Sprint 6 — Gestion des missions ⚪ À venir
Objectif
Permettre à un organisme de formation de créer et planifier ses interventions, puis mettre à jour automatiquement le planning des formateurs.
Gestion des missions
[ ] Création d'une mission
[ ] Modification d'une mission
[ ] Suppression d'une mission
[ ] Annulation d'une mission
[ ] Affectation d'un formateur
[ ] Dates de la mission
[ ] Horaires de la mission
[ ] Lieu de la mission
[ ] Client concerné
[ ] Type de formation
[ ] Statut de la mission
Planning
[ ] Passage automatique du planning en Mission
[ ] Affichage détaillé pour l'organisme propriétaire
[ ] Affichage Indisponible pour les autres organismes
[ ] Détection des conflits de planning
[ ] Prévention des doubles affectations
[ ] Vue planning globale
[ ] Mise à jour automatique du listing
Suivi
[ ] Historique des missions
[ ] Documents liés à la mission
[ ] Contrats
[ ] Archivage des missions terminées
---
Sprint 7 — Comptes utilisateurs ⚪ À venir
Objectif
Permettre aux formateurs de gérer eux-mêmes leur profil et leurs disponibilités.
Authentification
[ ] Création de compte
[ ] Connexion
[ ] Déconnexion
[ ] Réinitialisation du mot de passe
[ ] Sécurisation des accès
Profil formateur
[ ] Revendiquer sa fiche
[ ] Gestion du profil formateur
[ ] Modification des informations autorisées
[ ] Gestion du planning personnel
[ ] Gestion des disponibilités
[ ] Gestion des notes de disponibilité
Rôles et droits
[ ] Gestion des rôles
[ ] Gestion des droits
[ ] Distinction organisme / formateur / administrateur
[ ] Limitation des accès selon le rôle
---
Sprint 8 — Organisation ⚪ À venir
Objectif
Ajouter les outils nécessaires au pilotage quotidien de l'activité.
[ ] Calendrier global
[ ] Tableau de bord
[ ] Notifications
[ ] Emails automatiques
[ ] Alertes
[ ] Rappels
[ ] Suivi des actions importantes
[ ] Synthèse des missions à venir
[ ] Synthèse des disponibilités
[ ] Indicateurs d'activité
---
Sprint 9 — Version SaaS ⚪ À venir
Objectif
Ouvrir TimeForma à plusieurs organismes de formation tout en garantissant l'isolation et la confidentialité des données.
Multi-organismes
[ ] Gestion de plusieurs organismes
[ ] Isolation des données
[ ] Confidentialité entre organismes
[ ] Gestion des utilisateurs par organisme
[ ] Paramétrage des organismes
Administration
[ ] Interface d'administration
[ ] Gestion des comptes
[ ] Gestion des droits
[ ] Gestion des offres commerciales
[ ] Gestion des paramètres globaux
Commercialisation
[ ] Gestion des abonnements
[ ] Facturation
[ ] Paiements
[ ] Gestion des offres
[ ] Gestion des essais
[ ] Gestion des résiliations
---
Idées futures
IA de planification
IA d'affectation des formateurs
Recherche automatique du meilleur formateur selon la date, la distance, les compétences et le tarif
Application mobile
Signature électronique
API publique
Tableau de bord avancé
Statistiques d'activité
Messagerie entre organismes et formateurs
Notifications mobiles
Évaluation des formateurs par les apprenants
Gamification des formateurs
Suivi du nombre de sessions
Suivi du nombre de jours de formation
Suivi du nombre d'heures réalisées
Suivi du nombre d'apprenants formés