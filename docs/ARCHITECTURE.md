ARCHITECTURE - TimeForma
Version : 2.0  
Dernière mise à jour : 12/07/2026
Architecture générale
TimeForma est une application web développée avec React et Vite.
L'application est :
versionnée sur GitHub ;
déployée sur Vercel ;
connectée à Supabase pour le stockage des données.
L'architecture repose sur une séparation entre :
les pages ;
les composants ;
les hooks ;
les services ;
les utilitaires ;
la configuration externe.
Stack technique
Frontend
React
Vite
JavaScript
CSS
Backend
Supabase
PostgreSQL
Cartographie
Leaflet
Nominatim / OpenStreetMap pour le géocodage
Hébergement
Vercel
Versionnement
Git
GitHub
Principes d'architecture
Pages
Les pages orchestrent les composants, les hooks et les actions principales.
Elles ne doivent pas concentrer toute la logique métier.
Composants
Les composants gèrent l'affichage et les interactions locales.
Ils doivent rester aussi réutilisables et lisibles que possible.
Hooks
Les hooks regroupent les états et les comportements réutilisables.
Exemples :
chargement des formateurs ;
tri ;
filtres ;
distances ;
disponibilités du planning mensuel.
Services
Les services centralisent les accès aux données et les traitements externes.
Exemples :
Supabase ;
géocodage ;
calcul des distances ;
récupération des disponibilités.
Utilitaires
Les utilitaires contiennent les fonctions pures ne dépendant pas directement de React.
Arborescence actuelle
```txt
src/
│
├── assets/
│
├── components/
│   ├── listing/
│   │   ├── ListingFilters.jsx
│   │   ├── ListingHeader.jsx
│   │   ├── ListingTable.jsx
│   │   ├── SortHeader.jsx
│   │   └── planning/
│   │       ├── PlanningHeader.jsx
│   │       ├── PlanningRow.jsx
│   │       ├── PlanningCell.jsx
│   │       ├── PlanningLegend.jsx
│   │       └── planningUtils.js
│   │
│   └── formateur/
│       └── AvailabilityCalendar.jsx
│
├── hooks/
│   ├── useFormateurs.js
│   ├── useSort.js
│   ├── useListingFilters.js
│   ├── useDistances.js
│   └── usePlanningAvailability.js
│
├── pages/
│   ├── Listing.jsx
│   ├── FormateurForm.jsx
│   ├── FormateurView.jsx
│   ├── EnvCheck.jsx
│   └── MigrateLocal.jsx
│
├── services/
│   ├── formateursService.js
│   ├── availabilityService.js
│   ├── geocodingService.js
│   ├── distanceService.js
│   └── gpsService.js
│
├── utils/
│
├── lib/
│   └── supabaseClient.js
│
├── App.jsx
├── main.jsx
├── ErrorBoundary.jsx
├── App.css
└── index.css
```
---
Module Listing
`Listing.jsx`
La page `Listing.jsx` orchestre :
le chargement des formateurs ;
les filtres ;
le tri ;
le calcul des distances ;
le mois affiché ;
le chargement du planning ;
la suppression d'un formateur ;
la navigation vers les fiches.
`ListingTable.jsx`
Le composant affiche :
les informations principales du formateur ;
les actions ;
la structure générale du tableau ;
l'assemblage des composants du planning.
La logique détaillée du planning est désormais répartie dans le dossier `components/listing/planning/`.
`usePlanningAvailability.js`
Ce hook :
calcule la période du mois affiché ;
récupère les disponibilités ;
gère le chargement ;
gère les erreurs ;
transforme les données en structure indexée par formateur et par date.
`availabilityService.js`
Ce service effectue une requête Supabase unique pour récupérer les disponibilités :
de plusieurs formateurs ;
entre une date de début et une date de fin.
Cette approche évite une requête distincte par formateur.
Module Disponibilités
Fiche formateur
Le calendrier de la fiche permet :
de modifier rapidement le statut d'une journée ;
d'ajouter plusieurs notes ;
de modifier ou supprimer les notes ;
de visualiser la dernière mise à jour.
Modèle
Une disponibilité est identifiée par :
un formateur ;
une date.
La combinaison `trainer_id + day` est utilisée pour les opérations d'upsert.
Refactoring du listing
Le Sprint 4.5 a découpé `ListingTable.jsx` sans changer le rendu ni le comportement.
Arborescence retenue :
```txt
src/components/listing/
├── ListingFilters.jsx
├── ListingHeader.jsx
├── ListingTable.jsx
├── SortHeader.jsx
└── planning/
    ├── PlanningHeader.jsx
    ├── PlanningRow.jsx
    ├── PlanningCell.jsx
    ├── PlanningLegend.jsx
    └── planningUtils.js
```
Répartition :
`ListingTable.jsx` : structure générale, lignes formateurs et assemblage ;
`PlanningHeader.jsx` : mois, navigation, jours, chargement et erreurs ;
`PlanningRow.jsx` : frise mensuelle d'un formateur ;
`PlanningCell.jsx` : cellule journalière, note, jour actuel et info-bulle ;
`PlanningLegend.jsx` : légende ;
`planningUtils.js` : dates, statuts, couleurs, notes et info-bulles.
Règles de développement
préserver les comportements existants lors d'un refactoring ;
tester après chaque extraction ;
éviter la logique métier dans les pages ;
centraliser les accès Supabase dans les services ;
éviter une requête Supabase par ligne de tableau ;
conserver des composants lisibles ;
documenter les décisions structurantes ;
déployer uniquement après validation locale.