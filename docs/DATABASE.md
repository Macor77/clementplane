# DATABASE - Formaplane

Version : 5.0\
Dernière mise à jour : 16/07/2026\
Correspond au Sprint 6 terminé.

------------------------------------------------------------------------

# Objectif

Ce document décrit la structure de la base de données PostgreSQL
utilisée par Formaplane.

La base est hébergée sur Supabase et constitue l'unique source de vérité
des données métier.

------------------------------------------------------------------------

# Principes

-   Une information n'est stockée qu'à un seul endroit.
-   Les relations sont privilégiées aux duplications.
-   Les contraintes SQL garantissent la cohérence métier.
-   Toutes les opérations passent par les services de l'application.

------------------------------------------------------------------------

# Tables principales

## trainers

Contient les fiches des formateurs.

Principales informations :

-   identité
-   coordonnées
-   compétences
-   matériel
-   statut
-   tarif
-   coordonnées GPS

------------------------------------------------------------------------

## trainer_availability

Contient uniquement les disponibilités déclarées par le formateur.

Colonnes principales :

-   trainer_id
-   day
-   status
-   note
-   updated_at

### Statuts autorisés

-   dispo
-   indispo
-   (vide = non renseigné)

⚠️ Les états **Option** et **Mission** ne sont jamais enregistrés dans
cette table.

------------------------------------------------------------------------

## missions

Représente une mission.

Informations :

-   code interne
-   client
-   intitulé
-   formation
-   lieu
-   adresse
-   coordonnées GPS
-   compétences requises
-   matériel requis
-   prix de vente
-   coût formateur
-   commentaire
-   statut

### Statuts

-   brouillon
-   a_pourvoir
-   affectee
-   confirmee
-   realisee
-   annulee
-   archivee

------------------------------------------------------------------------

## mission_dates

Une mission possède une ou plusieurs journées.

Colonnes :

-   mission_id
-   date
-   heure_debut
-   heure_fin

Relation :

``` text
1 mission
    ↓
1..n mission_dates
```

------------------------------------------------------------------------

## mission_formateurs

Table de liaison entre les missions et les formateurs.

Colonnes principales :

-   mission_id
-   formateur_id
-   statut
-   propose_le
-   repondu_le
-   affecte_le
-   commentaire

### Statuts

-   selectionne
-   proposition_envoyee
-   accepte
-   refuse
-   affecte
-   indisponible_affecte_ailleurs
-   annule

------------------------------------------------------------------------

# Relations

``` text
missions
    │
    ├───────────────┐
    ▼               ▼
mission_dates   mission_formateurs
                     │
                     ▼
                 trainers
```

------------------------------------------------------------------------

# Planning intelligent

Le planning est calculé par fusion :

``` text
trainer_availability
        +
mission_formateurs
        +
mission_dates
```

Priorité :

1.  Mission
2.  Option
3.  Indisponible déclaré
4.  Disponible
5.  Non renseigné

------------------------------------------------------------------------

# Contraintes importantes

## Une seule affectation

Une mission ne peut posséder qu'un seul formateur avec le statut :

``` text
affecte
```

Un index unique partiel garantit cette règle.

------------------------------------------------------------------------

## Conflits

Lorsqu'un formateur est affecté à une mission :

-   toutes les autres propositions acceptées en conflit passent
    automatiquement à :

``` text
indisponible_affecte_ailleurs
```

Si le conflit disparaît, elles reviennent automatiquement à :

``` text
accepte
```

------------------------------------------------------------------------

# Philosophie

La base doit rester simple, normalisée et prête à évoluer vers une
architecture multi-organismes sans remise en cause des tables
existantes.
