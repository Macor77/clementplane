PRD - TimeForma
Version : 2.0  
Dernière mise à jour : 12/07/2026
---
1. Présentation
TimeForma est une plateforme de gestion de formateurs créée par Alter Prévention.
L'objectif est de permettre à un organisme de formation de gérer simplement :
ses formateurs ;
leurs compétences ;
leurs coordonnées ;
leur localisation ;
leurs disponibilités ;
leur future affectation aux missions.
À terme, TimeForma deviendra une plateforme SaaS accessible à plusieurs organismes de formation et aux formateurs.
---
2. Objectifs produit
Les objectifs principaux sont :
centraliser les informations des formateurs ;
trouver rapidement un formateur adapté ;
comparer les disponibilités sur une même période ;
visualiser les distances entre les formateurs et les lieux de mission ;
simplifier l'organisation des formations ;
réduire le temps administratif ;
préparer une gestion automatisée des missions.
---
3. Public visé
Aujourd'hui
Alter Prévention
À terme
organismes de formation ;
responsables pédagogiques ;
planificateurs ;
assistants administratifs ;
formateurs indépendants ;
administrateurs de la plateforme.
---
4. Fonctionnalités actuelles
Gestion des formateurs
création ;
modification ;
suppression ;
consultation.
Chaque fiche contient notamment :
identité ;
coordonnées ;
adresse ;
ville ;
code postal ;
email ;
téléphone ;
compétences ;
matériel ;
tarif ;
statut ;
notes internes ;
géolocalisation.
---
Recherche et filtres
Recherche par :
nom ;
ville ;
département ;
compétences ;
matériel ;
statut.
Le listing permet également :
le tri des colonnes ;
le calcul des distances ;
la consultation rapide du planning mensuel.
---
Distances
Calcul automatique de la distance entre :
un lieu de formation ;
chaque formateur disposant de coordonnées GPS valides.
Le logiciel peut compléter les coordonnées GPS manquantes.
---
Carte
affichage Leaflet ;
visualisation des formateurs sur une carte.
---
Disponibilités journalières
Le calendrier de la fiche formateur permet d'indiquer :
Disponible ;
Indisponible ;
Non renseigné.
Le statut Mission n'est pas sélectionné manuellement.
Une journée peut contenir plusieurs notes.
Exemples :
Disponible uniquement après 14 h ;
Disponible en distanciel ;
Préférer les missions en Île-de-France.
---
Planning mensuel du listing
Le listing affiche une frise mensuelle commune à tous les formateurs.
Fonctions disponibles :
navigation entre les mois ;
retour au mois courant ;
alignement vertical des jours ;
couleurs par statut ;
mise en évidence du jour actuel ;
indicateur de note ;
affichage du détail au survol ;
en-tête fixe pendant le défilement.
Les disponibilités du mois sont chargées en une seule requête Supabase.
---
5. Fonctionnalités prévues
Prochaine étape : refactoring du listing
découpage de `ListingTable.jsx` ;
extraction du planning en composants spécialisés ;
maintien strict du rendu et des performances.
Recherche et ergonomie
filtre Disponible le ;
filtre Disponible aujourd'hui ;
filtre Disponible cette semaine ;
filtre Disponible ce mois ;
filtre par période ;
recherche multicritères ;
modernisation des filtres ;
colonnes masquables ;
préférences d'affichage.
Missions
création d'une mission ;
modification ;
annulation ;
affectation d'un formateur ;
gestion des dates et horaires ;
gestion du client et du lieu ;
détection des conflits ;
passage automatique du planning en Mission ;
confidentialité entre organismes ;
historique ;
documents et contrats.
Comptes utilisateurs
authentification ;
comptes formateurs ;
gestion du profil ;
gestion du planning personnel ;
rôles et droits ;
sécurisation des accès.
Organisation
calendrier global ;
tableau de bord ;
notifications ;
emails automatiques ;
alertes ;
rappels.
Version SaaS
multi-organismes ;
isolation des données ;
administration ;
abonnements ;
facturation ;
paiements.
---
6. Technologies
Frontend
React
Vite
Backend
Supabase
PostgreSQL
Cartographie
Leaflet
Nominatim / OpenStreetMap
Déploiement
GitHub
Vercel
---
7. Contraintes produit
TimeForma doit rester :
simple ;
rapide ;
moderne ;
agréable ;
intuitif ;
lisible ;
performant.
Les fonctionnalités doivent :
apporter une valeur métier concrète ;
éviter les manipulations inutiles ;
préserver la confidentialité ;
rester adaptées à un grand nombre de formateurs ;
préparer l'évolution vers le SaaS.
---
8. Indicateurs de réussite
Le produit doit permettre à un organisme de :
identifier rapidement les formateurs disponibles à une date donnée ;
réduire le nombre d'ouvertures de fiches individuelles ;
comparer les disponibilités de plusieurs formateurs en un regard ;
rechercher un formateur par compétence, lieu et distance ;
conserver un planning simple à mettre à jour ;
réduire le temps consacré à la planification.