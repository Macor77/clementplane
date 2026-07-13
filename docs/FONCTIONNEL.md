FONCTIONNEL - TimeForma
Version : 2.0  
Dernière mise à jour : 12/07/2026
---
Objectif
Ce document décrit le fonctionnement métier de TimeForma.
Il précise ce que le logiciel doit permettre aux utilisateurs de faire, indépendamment de la manière dont il est développé techniquement.
---
Vision
TimeForma est une plateforme de gestion des formateurs indépendants.
Le logiciel doit permettre :
aux organismes de formation de trouver rapidement un formateur adapté et disponible ;
aux formateurs de gérer leurs informations et leurs disponibilités ;
à chaque organisme de protéger ses informations confidentielles ;
de réduire le temps consacré à la recherche, à la planification et au suivi des formateurs.
---
Acteurs
Formateur
Le formateur est destiné à devenir propriétaire de sa fiche et de ses disponibilités.
À terme, il pourra notamment :
gérer ses informations personnelles autorisées ;
gérer ses disponibilités ;
ajouter des précisions sur ses disponibilités ;
consulter ses missions ;
travailler avec plusieurs organismes.
Organisme de formation
Un organisme peut :
créer et gérer des fiches formateurs ;
rechercher un formateur ;
filtrer et trier le listing ;
calculer la distance entre un lieu de formation et les formateurs ;
consulter les disponibilités mensuelles des formateurs ;
proposer et gérer des missions à terme.
Un organisme ne peut jamais consulter les données confidentielles d'un autre organisme.
---
Gestion des formateurs
Une fiche formateur contient notamment :
prénom ;
nom ;
email ;
téléphone ;
adresse ;
code postal ;
ville ;
latitude ;
longitude ;
compétences ;
matériel ;
tarif ;
statut ;
notes internes.
L'organisme peut :
créer une fiche ;
consulter une fiche ;
modifier une fiche ;
supprimer une fiche.
---
Recherche et listing
Le listing permet de consulter l'ensemble des formateurs.
Les informations principales affichées sont :
formateur ;
localisation ;
compétences ;
statut ;
distance ;
planning mensuel.
Les actions principales sont affichées sous le nom du formateur :
Voir ;
Modifier ;
Supprimer.
Les filtres et tris existants restent disponibles.
---
Distances et géolocalisation
TimeForma peut calculer la distance entre :
un lieu de formation ;
chaque formateur disposant de coordonnées GPS valides.
Le logiciel peut également compléter automatiquement les coordonnées GPS manquantes à partir de l'adresse, du code postal ou de la ville.
---
Disponibilités du formateur
Principe général
Le planning repose principalement sur une logique journalière :
un formateur ;
une date ;
un statut déclaré ;
une ou plusieurs notes éventuelles.
Le formateur ou l'organisme renseigne simplement la situation d'une journée.
Statuts déclarés
Les statuts manuels sont :
Disponible ;
Indisponible ;
Non renseigné.
Le cycle de clic est :
```text
Non renseigné → Disponible → Indisponible → Non renseigné
```
Le statut Mission n'est pas sélectionné manuellement.
Notes de disponibilité
Une journée peut contenir une ou plusieurs notes.
Une ligne correspond à une information.
Exemples :
Disponible uniquement à partir de 14 h ;
Disponible en distanciel ;
Préférer les missions en Île-de-France.
Les notes peuvent être :
ajoutées ;
modifiées ;
supprimées individuellement en supprimant leur ligne ;
supprimées entièrement.
Le bouton de gestion des notes indique le nombre de notes présentes.
Dernière mise à jour
La fiche formateur indique la dernière mise à jour connue du planning affiché.
---
Planning mensuel dans le listing
Objectif
Le planning mensuel intégré au listing permet de comparer les disponibilités de plusieurs formateurs sur le même mois.
Il doit répondre rapidement à la question :
> Quel formateur est disponible à une date donnée ?
Présentation
Le planning prend la forme d'une frise horizontale commune à toutes les lignes.
Chaque jour du mois correspond à une colonne verticale alignée pour tous les formateurs.
Le mois est identique pour toutes les lignes.
Navigation
L'en-tête du planning permet :
d'afficher le mois précédent ;
d'afficher le mois suivant ;
de revenir au mois courant.
Le changement de mois actualise simultanément toutes les lignes.
Couleurs
Vert : Disponible ;
Rouge : Indisponible ;
Gris : Non renseigné ;
Jaune : Mission.
Le jour actuel est mis en évidence.
Notes dans le listing
Lorsqu'une journée contient une ou plusieurs notes, un point noir apparaît dans la case.
Au survol d'une case, TimeForma affiche :
le nom du formateur ;
la date ;
le statut ;
les notes éventuelles.
Le point noir ne possède pas sa propre info-bulle : le survol affiche toujours le détail complet de la journée.
En-tête fixe
L'en-tête du tableau reste visible lors du défilement vertical.
L'utilisateur conserve ainsi en permanence :
les noms des colonnes ;
le mois affiché ;
l'alignement des jours.
---
Missions
Principe
Les missions appartiennent à l'organisme qui les crée.
Le statut Mission sera généré automatiquement par le système lorsqu'une mission sera affectée à un formateur.
Le formateur n'aura pas à renseigner manuellement ce statut.
Visibilité
Une mission sera visible :
par le formateur concerné ;
par l'organisme propriétaire.
Les autres organismes ne verront pas les détails de la mission.
Ils verront uniquement que le formateur est indisponible.
---
Propriété des données
Chaque donnée possède un propriétaire.
Le propriétaire détermine :
qui peut modifier la donnée ;
qui peut la consulter ;
qui peut la supprimer.
Cette règle devra être appliquée à l'ensemble des futures fonctionnalités multi-organismes.
---
Confidentialité
Le logiciel doit protéger les informations commerciales.
Un organisme ne doit jamais connaître les données confidentielles d'un autre organisme, notamment :
ses clients ;
ses lieux d'intervention ;
ses tarifs ;
ses commentaires internes ;
les détails de ses missions.
---
Philosophie produit
TimeForma privilégie :
la simplicité ;
la rapidité ;
la lisibilité ;
la confidentialité ;
la collaboration ;
l'automatisation ;
la réutilisation des données.
Chaque nouvelle fonctionnalité doit améliorer l'expérience utilisateur sans alourdir inutilement l'interface.