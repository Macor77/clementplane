# DECISIONS - Formaplane

Version : 10.0  Dernière mise à jour : 18/08/2026

------------------------------------------------------------------------

# Objectif

Ce document recense les décisions d'architecture et de conception qui
structurent durablement Formaplane. Chaque décision est conservée afin
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


------------------------------------------------------------------------

# Décisions Sprints 8 à 10

## Décision 11 — Un compte peut avoir plusieurs espaces

Un même utilisateur peut être membre d'un organisme, formateur, ou cumuler les deux rôles. Le changement d'espace ne nécessite pas plusieurs comptes d'authentification.

## Décision 12 — Profil global et données privées OF sont séparés

Un OF ne doit pas pouvoir imposer à tous les autres organismes les informations privées qu'il conserve sur un formateur. Avant revendication, la localisation peut être propre à la relation OF / formateur. Après revendication, les données globales pilotées par le formateur deviennent la référence.

## Décision 13 — Les compétences et le matériel utilisent des référentiels

Les saisies sont normalisées par des catalogues partagés. Le moteur historique reste compatible afin d'éviter une refonte risquée avant la bêta.

## Décision 14 — Plusieurs options peuvent coexister

Plusieurs formateurs peuvent accepter la même mission. Une acceptation n'est pas une affectation définitive. L'OF conserve le choix final.

## Décision 15 — Affecter un formateur clôt les autres options

Lorsqu'un formateur est affecté, les autres propositions/options encore actives de cette mission passent à **Mission pourvue ailleurs**. Cette opération doit être atomique pour garantir la cohérence de la base.

## Décision 16 — Une modification de mission peut exiger une revalidation

L'OF peut modifier la mission, mais un formateur déjà engagé ne doit pas être considéré comme ayant accepté automatiquement les nouvelles conditions. Si son accord est requis, son état devient **Revalidation en attente** et toute confirmation d'affectation est bloquée jusqu'à sa réponse.

## Décision 17 — Les actions et commentaires métier sont historisés

Acceptation, refus, désistement, affectation, clôture et revalidation doivent rester traçables avec l'auteur et, lorsqu'il existe, le commentaire associé.

## Décision 18 — Les missions annulées restent dans Missions, pas dans le planning

Le planning sert à piloter l'activité opérationnelle. Une mission annulée doit rester retrouvable dans le listing Missions mais ne doit plus encombrer le calendrier.

## Décision 19 — Suppression du statut Brouillon

Une mission créée est immédiatement une mission métier **À pourvoir**. Le statut `brouillon` est supprimé du modèle afin d'éviter un parcours parallèle sans utilité opérationnelle.
