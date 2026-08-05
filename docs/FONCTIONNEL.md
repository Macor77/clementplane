# FONCTIONNEL - TimeForma

Version : 5.2\
Dernière mise à jour : 05/08/2026\
Correspond au Sprint 7 terminé.

------------------------------------------------------------------------

# Présentation

TimeForma est un logiciel de gestion des formateurs et des missions
destiné aux organismes de formation.

Son objectif est de permettre à un coordinateur de préparer, proposer,
affecter et suivre une mission depuis une seule interface.

------------------------------------------------------------------------

# Les grands modules

-   Gestion des formateurs
-   Planning
-   Recherche multicritères
-   Géolocalisation
-   Gestion des missions
-   Moteur de recommandation
-   Workflow de propositions
-   Affectation
-   Tableau de bord
-   Planning des missions
-   Navigation multi-vues

------------------------------------------------------------------------

# Cycle complet d'une mission

``` text
Création
    ↓
Recherche des formateurs
    ↓
Sélection
    ↓
Proposition envoyée
    ↓
Acceptation / Refus
    ↓
OPTION
    ↓
Affectation par l'OF
    ↓
MISSION
```

## Principe fondamental

Une mission existe indépendamment des formateurs.

Elle peut être créée sans qu'aucun formateur ne soit encore sélectionné.

------------------------------------------------------------------------

# Les statuts d'une proposition

-   Sélectionné
-   Proposition envoyée
-   Accepté
-   Refusé
-   Affecté
-   Indisponible (affecté ailleurs)

## Accepté ≠ Affecté

L'acceptation signifie :

-   le formateur est d'accord ;
-   l'OF ne l'a pas encore confirmé.

L'affectation signifie :

-   le formateur est officiellement retenu ;
-   les dates sont bloquées.

------------------------------------------------------------------------

# La notion d'OPTION

Une OPTION apparaît lorsqu'un formateur accepte une proposition.

Elle signifie :

-   le formateur reste disponible ;
-   il peut recevoir d'autres propositions ;
-   elle n'influence pas son score dans les recommandations.

Une option devient automatiquement une Mission lorsque l'OF clique sur «
Affecter ».

------------------------------------------------------------------------

# Confidentialité

Un organisme de formation ne voit jamais :

-   les autres missions ;
-   les autres organismes ;
-   les autres clients ;
-   le nombre d'options concurrentes.

En cas de conflit, seul le message « Indisponible » est affiché.

------------------------------------------------------------------------

# Planning intelligent

Le planning est calculé à partir de deux sources :

-   disponibilités déclarées ;
-   missions.

Priorité :

1.  Mission
2.  Option
3.  Indisponible déclaré
4.  Disponible
5.  Non renseigné

Les états Option et Mission sont calculés automatiquement.

------------------------------------------------------------------------

# Moteur de recommandation

Les recommandations prennent en compte :

-   les compétences ;
-   le matériel ;
-   la distance ;
-   le statut du formateur ;
-   les disponibilités déclarées.

Une Option n'est jamais pénalisante.

Une Mission rend le formateur indisponible.

------------------------------------------------------------------------

# Résultat attendu

Le coordinateur peut gérer une mission complète sans quitter TimeForma :

-   création ;
-   recherche ;
-   comparaison ;
-   proposition ;
-   suivi ;
-   affectation ;
-   contrôle des conflits ;
-   visualisation dans le planning.


------------------------------------------------------------------------

# Évolutions v0.6.1

L'écran Mission devient l'écran principal de travail.

Le coordinateur dispose :
- d'une colonne d'informations sur la mission ;
- des mêmes filtres que le listing ;
- d'un tri par proximité ;
- de l'affichage du lieu réellement reconnu ;
- d'un accès direct à la fiche de chaque formateur.


------------------------------------------------------------------------

# Évolutions Sprint 7

Le Sprint 7 apporte principalement des améliorations ergonomiques et une
nouvelle organisation de l'application.

## Navigation

Le logiciel est désormais organisé autour des pages :

- Accueil
- Planning
- Missions
- Formateurs
- Carte
- Paramètres

## Planning

Le planning mensuel devient la vue principale de planification.

Il permet :

- de visualiser toutes les missions du mois ;
- d'afficher un compteur lorsqu'une journée comporte plusieurs missions ;
- de conserver une hauteur fixe des cellules ;
- d'accéder rapidement aux informations de chaque mission.

## Gestion des missions

Les évolutions principales sont :

- remplacement du champ « Intitulé de la mission » par « Code interne de session » ;
- remplacement du champ « Lieu » par « Nom du site » (facultatif) ;
- calcul des distances exclusivement à partir de l'adresse, du code postal et de la ville afin de fiabiliser les recommandations.
