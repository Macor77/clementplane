# DECISIONS - TimeForma

Version : 5.0 Dernière mise à jour : 16/07/2026

------------------------------------------------------------------------

# Objectif

Ce document recense les décisions d'architecture et de conception qui
structurent durablement TimeForma. Chaque décision est conservée afin
d'expliquer les choix effectués et d'éviter de revenir sur des
arbitrages déjà validés.

------------------------------------------------------------------------

# Sprint 6 --- Moteur de missions

## Décision 1 --- Une mission est indépendante des formateurs

Une mission peut être créée, enregistrée et modifiée avant même qu'un
formateur soit sélectionné.

**Pourquoi ?**

-   préparation en amont ;
-   recherche plus tardive ;
-   meilleure flexibilité.

------------------------------------------------------------------------

## Décision 2 --- Distinction Option / Mission

Le statut **Accepté** représente une **Option**.

Le statut **Affecté** représente une **Mission confirmée**.

Une acceptation ne bloque jamais automatiquement le planning.

------------------------------------------------------------------------

## Décision 3 --- Une Option ne pénalise pas les recommandations

Un formateur ayant accepté une proposition continue :

-   à apparaître dans les recherches ;
-   à recevoir d'autres propositions ;
-   à conserver le même score.

------------------------------------------------------------------------

## Décision 4 --- Une Mission bloque le planning

Une mission affectée rend le formateur indisponible sur les dates
concernées.

Cette indisponibilité est calculée automatiquement.

------------------------------------------------------------------------

## Décision 5 --- Confidentialité entre organismes

Un organisme de formation ne doit jamais connaître :

-   les clients d'un autre OF ;
-   ses missions ;
-   ses propositions ;
-   le nombre d'options concurrentes.

En cas de conflit, seul un statut neutre est affiché.

------------------------------------------------------------------------

## Décision 6 --- Planning calculé

Le planning est construit à partir de :

-   trainer_availability ;
-   mission_formateurs ;
-   mission_dates.

Les états **Option** et **Mission** ne sont jamais enregistrés dans
`trainer_availability`.

------------------------------------------------------------------------

## Décision 7 --- Une seule source de vérité

Chaque donnée est stockée une seule fois.

Les vues de l'application déduisent ensuite les états nécessaires.

------------------------------------------------------------------------

## Décision 8 --- Une seule affectation

Une mission ne peut posséder qu'un seul formateur affecté.

Cette règle est garantie :

-   par la logique métier ;
-   par une contrainte SQL.

------------------------------------------------------------------------

## Décision 9 --- Gestion automatique des conflits

Lorsqu'un formateur est affecté à une mission, toutes les autres
propositions acceptées en conflit deviennent :

`indisponible_affecte_ailleurs`

Si le conflit disparaît, elles reviennent automatiquement à :

`accepte`

------------------------------------------------------------------------

## Décision 10 --- Développement incrémental

Chaque sprint doit produire une fonctionnalité immédiatement
exploitable.

La documentation est mise à jour avant la clôture du sprint.

------------------------------------------------------------------------

# Principes conservés

-   simplicité d'utilisation ;
-   séparation des responsabilités ;
-   architecture modulaire ;
-   confidentialité par défaut ;
-   préparation au SaaS multi-organismes ;
-   priorité à la valeur métier.
