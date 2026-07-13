CHANGELOG - TimeForma
Toutes les évolutions importantes du projet sont consignées dans ce document.
2026-07-13
Version 0.9 — Refactoring du planning du listing
Architecture
Création du dossier `components/listing/planning/`
Création de `PlanningHeader.jsx`
Création de `PlanningRow.jsx`
Création de `PlanningCell.jsx`
Création de `PlanningLegend.jsx`
Création de `planningUtils.js`
Refactoring
Réduction de la taille et des responsabilités de `ListingTable.jsx`
Extraction de la navigation mensuelle et de l'en-tête des jours
Extraction de la frise mensuelle de chaque formateur
Extraction de l'affichage des cellules journalières
Centralisation des calculs de dates, statuts, couleurs, notes et info-bulles
Validation
Aucun changement visuel prévu
Aucun changement fonctionnel prévu
Validation ESLint sans erreur
Compilation de production réussie
2026-07-12
Version 0.8 — Planning mensuel intégré au listing
Listing
Réorganisation des colonnes du listing
Regroupement du prénom et du nom dans la colonne Formateur
Regroupement de la ville et du code postal dans la colonne Localisation
Déplacement des actions Voir, Modifier et Supprimer sous le nom du formateur
Suppression de la colonne Actions dédiée
Optimisation des largeurs de colonnes
Planning mensuel
Ajout d'une colonne Planning dans le listing
Ajout d'une frise horizontale mensuelle
Navigation vers le mois précédent et le mois suivant
Ajout d'un bouton de retour au mois courant
Changement de mois commun à tous les formateurs
Alignement vertical des jours
Mise en évidence du jour actuel
Couleurs vives selon le statut :
vert pour Disponible
rouge pour Indisponible
gris pour Non renseigné
jaune pour Mission
Ajout d'une légende
Ajout d'un point noir lorsqu'une note est présente
Affichage du statut et des notes au survol
Correction du survol du point noir afin de conserver l'info-bulle complète
En-tête du tableau fixé pendant le défilement vertical
Correction de l'affichage de l'en-tête Formateur
Données et performances
Création de `availabilityService.js`
Création de `usePlanningAvailability.js`
Chargement de toutes les disponibilités du mois en une seule requête Supabase
Mise à jour automatique des données lors du changement de mois
Gestion du chargement et des erreurs
Déploiement
Déploiement sur Vercel
Validation du fonctionnement en production
2026-07-12
Version 0.7 — Refonte des disponibilités journalières
Calendrier formateur
Simplification des statuts manuels :
Disponible
Indisponible
Non renseigné
Suppression du statut Mission du cycle de clic manuel
Ajout de la colonne `note` dans `trainer_availability`
Ajout de plusieurs notes par journée
Ajout d'une fenêtre dédiée à la gestion des notes
Modification et suppression des notes
Suppression de toutes les notes d'une journée
Affichage des notes dans le calendrier
Bouton Note intelligent avec comptage
Aide contextuelle dans la fenêtre des notes
Mise à jour de la légende
Préparation du futur statut Mission automatique
2026-07-09
Version 0.6 — Refactoring complet du module Listing
Architecture
Création du dossier `hooks/`
Création des hooks :
`useFormateurs`
`useSort`
`useListingFilters`
`useDistances`
Réorganisation des composants :
`components/listing`
`components/formateur`
Services
Création de services spécialisés :
`geocodingService`
`distanceService`
`gpsService`
Refactoring
Extraction de la logique de géocodage hors de `Listing.jsx`
Extraction du calcul des distances
Extraction du chargement des formateurs
Extraction du tri
Extraction des filtres
Extraction de la gestion GPS
Simplification de la suppression des formateurs
Résultat
`Listing.jsx` devient une page d'orchestration
Les responsabilités sont réparties entre hooks, services et composants
L'architecture est prête pour les futurs modules
Versions précédentes
Version 0.5 — Déploiement
GitHub
Vercel
Synchronisation du projet
Version 0.4 — Disponibilités initiales
Calendrier
Gestion des disponibilités
Mission Alter Prévention
Version 0.3 — Cartographie
Intégration de Leaflet
Géolocalisation automatique
Calcul des distances
Version 0.2 — Recherche
Recherche multicritères
Tri des colonnes
Filtres
Version 0.1 — Début du projet
Création des fiches formateurs
Modification
Suppression
Consultation