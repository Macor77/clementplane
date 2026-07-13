DECISIONS - TimeForma
Version : 2.0  
Dernière mise à jour : 12/07/2026
---
Objectif
Ce document recense les décisions fonctionnelles et techniques structurantes du projet TimeForma.
Chaque décision précise :
le contexte ;
la décision retenue ;
les conséquences pour les futurs développements.
---
Décisions techniques
React
Décision
Utiliser React pour le développement de l'interface.
Raisons
écosystème mature ;
grande communauté ;
composants réutilisables ;
facilité d'évolution.
---
Vite
Décision
Utiliser Vite comme outil de développement.
Raisons
démarrage rapide ;
build performant ;
configuration simple.
---
GitHub
Décision
Héberger le code source sur GitHub.
Raisons
versionnement ;
historique complet ;
sauvegarde du code ;
intégration avec Vercel.
---
Vercel
Décision
Déployer l'application sur Vercel.
Raisons
déploiement automatique ;
intégration avec GitHub ;
hébergement simple et fiable.
---
Supabase
Décision
Utiliser Supabase comme backend principal.
Raisons
base PostgreSQL ;
authentification intégrée ;
API automatique ;
temps réel ;
stockage de fichiers ;
évolutivité vers une version SaaS.
---
Architecture par services
Décision
Tous les accès aux données doivent passer par des fichiers `services`.
Raisons
séparer l'interface des données ;
faciliter les évolutions ;
simplifier les tests ;
éviter la duplication du code.
---
Pages React comme orchestrateurs
Contexte
Le composant `Listing.jsx` concentrait auparavant une grande partie de la logique métier de l'application.
Décision
Les pages React deviennent des composants d'orchestration.
Les responsabilités sont réparties entre :
hooks ;
services ;
composants ;
utilitaires.
Conséquence
Aucune logique métier importante ne doit être ajoutée directement dans une page React lorsqu'elle peut être extraite proprement.
---
Décisions fonctionnelles
Disponibilités gérées à la journée
Contexte
Une gestion détaillée par heure aurait complexifié la mise à jour du planning et ralenti l'utilisation par les formateurs.
Décision
Le planning repose principalement sur une logique journalière :
un formateur ;
une date ;
un statut ;
une ou plusieurs notes éventuelles.
Conséquence
Le planning reste rapide à mettre à jour et simple à lire.
---
Statuts manuels limités
Décision
Les statuts pouvant être renseignés manuellement sont :
Disponible ;
Indisponible ;
Non renseigné.
Conséquence
Le cycle de clic est limité à ces trois états.
Le statut Mission n'est pas accessible dans le cycle manuel.
---
Mission calculée automatiquement
Contexte
Une mission est une conséquence de l'affectation réalisée par un organisme, et non une disponibilité déclarée par le formateur.
Décision
Le statut Mission sera généré automatiquement par le système lorsqu'une mission sera affectée.
Conséquence
le formateur ne renseigne jamais manuellement une mission ;
l'organisme propriétaire voit les détails ;
les autres organismes voient uniquement une indisponibilité.
---
Plusieurs notes par journée
Décision
Une journée peut contenir plusieurs informations, stockées sous forme de lignes dans le champ de note.
Conséquence
une ligne correspond à une information ;
une note peut être supprimée en supprimant sa ligne ;
toutes les notes peuvent être supprimées en vidant le champ ;
le bouton indique le nombre de notes présentes.
---
Frise mensuelle commune dans le listing
Contexte
Le besoin principal d'un organisme est de comparer plusieurs formateurs sur une même date.
Décision
Le listing affiche une frise horizontale mensuelle commune à tous les formateurs, plutôt qu'un mini-calendrier indépendant par ligne.
Conséquence
tous les formateurs affichent le même mois ;
les jours sont alignés verticalement ;
la comparaison date par date est immédiate ;
le changement de mois agit sur toutes les lignes.
---
Chargement groupé des disponibilités
Décision
Les disponibilités du mois sont récupérées en une seule requête Supabase pour tous les formateurs concernés.
Conséquence
Aucune requête distincte ne doit être lancée pour chaque formateur.
Cette règle protège les performances lorsque le nombre de formateurs augmente.
---
Actions sous le nom du formateur
Contexte
Une colonne Actions dédiée réduisait la largeur disponible pour le planning mensuel.
Décision
Les boutons Voir, Modifier et Supprimer sont placés sous le nom du formateur.
Conséquence
suppression de la colonne Actions ;
augmentation légère de la hauteur des lignes ;
libération de largeur pour le planning.
---
En-tête du listing fixe
Décision
L'en-tête du tableau reste visible pendant le défilement vertical.
Conséquence
L'utilisateur conserve en permanence :
les noms des colonnes ;
le mois sélectionné ;
les numéros des jours ;
l'alignement du planning.
---
Indicateur unique de note
Décision
Un seul point noir est affiché dans une case lorsqu'au moins une note existe, quel que soit le nombre de notes.
Conséquence
Le point sert uniquement d'indice visuel.
Le détail complet reste accessible au survol de la case.
---
Refactoring à venir
Refactoring de `ListingTable.jsx`
Contexte
Le fichier `ListingTable.jsx` est devenu trop volumineux et difficile à maintenir.
Décision
Le composant doit être découpé sans changement visuel ni fonctionnel.
Découpage cible
`ListingTable.jsx`
`PlanningHeader.jsx`
`PlanningRow.jsx`
`PlanningCell.jsx`
`PlanningLegend.jsx`
`planningUtils.js`
Contraintes
aucun changement de comportement ;
aucun changement visuel ;
aucun changement Supabase ;
tests après chaque extraction ;
validation avant déploiement.
---
Philosophie
Les choix techniques et fonctionnels doivent toujours privilégier :
la simplicité ;
la lisibilité ;
la maintenabilité ;
l'évolutivité ;
la performance ;
la valeur métier.
Une solution simple et robuste est préférée à une solution plus complexe, même si cette dernière paraît plus élégante techniquement.