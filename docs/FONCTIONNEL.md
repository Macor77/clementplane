# FONCTIONNEL - TimeForma

Version : 8.0
Dernière mise à jour : 11/08/2026
Correspond au Sprint 8 terminé et validé.

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
------------------------------------------------------------------------

# Évolutions Sprint 8

Le Sprint 8 introduit les comptes utilisateurs réels et transforme TimeForma en plateforme multi-organismes dans laquelle un même formateur peut collaborer avec plusieurs OF.

## Compte utilisateur unique

Un utilisateur possède un seul compte d'authentification.

Ce compte peut donner accès à :

- un espace organisme de formation ;
- un espace formateur ;
- les deux espaces simultanément.

Lorsqu'un utilisateur cumule les deux rôles, il peut choisir son espace et passer de l'un à l'autre sans créer un second compte.

## Authentification

TimeForma permet désormais :

- la création d'un compte organisme ;
- la création d'un compte formateur ;
- la connexion ;
- la déconnexion ;
- la récupération d'un mot de passe oublié ;
- la définition d'un nouveau mot de passe ;
- l'affichage ou le masquage des mots de passe dans les formulaires concernés.

## Revendication d'une fiche formateur

Lorsqu'un formateur crée son compte, TimeForma cherche à le rattacher à une fiche existante.

Le principe est de ne pas dupliquer un formateur déjà présent dans la base.

Une fiche revendiquée devient le profil professionnel du compte formateur.

## Espace formateur

Le formateur dispose d'un espace dédié lui permettant notamment de :

- consulter son tableau de bord ;
- consulter et modifier son profil ;
- gérer ses disponibilités ;
- consulter son planning ;
- consulter ses propositions ;
- accepter ou refuser une proposition ;
- consulter ses missions.

## Disponibilités et historique

Les disponibilités appartiennent au profil formateur et peuvent être mises à jour depuis plusieurs espaces autorisés.

Chaque modification est historisée afin de conserver la traçabilité.

L'affichage de l'auteur respecte la confidentialité :

- le formateur peut identifier l'organisme ayant modifié sa disponibilité ;
- l'organisme auteur voit « Vous » ;
- un autre organisme voit une indication neutre de type « Un organisme partenaire ».

Les notes associées aux disponibilités suivent les mêmes principes de propriété et de confidentialité.

## Réseau multi-organismes

Une même fiche formateur peut appartenir au réseau de plusieurs organismes.

Un OF peut :

- rechercher un formateur déjà présent dans TimeForma ;
- consulter les informations communes autorisées ;
- l'ajouter à son propre réseau sans créer de doublon.

Les informations propres à la relation entre un OF et un formateur restent isolées des autres organismes.

## Confidentialité inter-organismes

Lorsqu'un formateur est affecté sur une mission d'un autre organisme, l'OF tiers ne doit jamais connaître :

- le nom de l'autre OF ;
- le client ;
- le contenu de la mission ;
- le lieu ou les détails de cette mission.

Il voit uniquement que le formateur est « Indisponible » pour la date concernée.

L'OF propriétaire de la mission conserve, lui, l'affichage normal de la mission.

## Inscription des organismes

Un nouvel organisme peut créer son compte et son espace TimeForma.

Les données et relations sont rattachées à l'organisation concernée afin de préparer l'exploitation SaaS multi-organismes.

## Résultat fonctionnel

À l'issue du Sprint 8, TimeForma permet à plusieurs organismes de travailler avec une même base de profils formateurs tout en conservant leurs informations métier confidentielles.

Le formateur devient également un utilisateur actif de la plateforme : il peut gérer son profil, ses disponibilités et ses réponses aux propositions.
