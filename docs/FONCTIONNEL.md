# FONCTIONNEL - TimeForma

Version : 1.0
Dernière mise à jour : 09/07/2026

---

# Objectif

Ce document décrit le fonctionnement métier de TimeForma.

Contrairement à ARCHITECTURE.md, il ne décrit pas comment le logiciel est développé.

Il décrit comment le logiciel doit se comporter pour ses utilisateurs.

---

# Vision

TimeForma est une plateforme de gestion des formateurs indépendants.

Le logiciel doit permettre :

- aux organismes de formation de trouver rapidement un formateur disponible ;
- aux formateurs de gérer leur activité avec plusieurs organismes ;
- à chaque organisme de protéger ses informations confidentielles.

---

# Les acteurs

## Formateur

Le formateur est propriétaire de sa fiche.

Il peut notamment :

- gérer ses informations personnelles ;
- gérer ses disponibilités ;
- consulter ses missions ;
- travailler avec plusieurs organismes.

---

## Organisme de formation

Un organisme peut :

- rechercher un formateur ;
- proposer une mission ;
- gérer ses propres missions ;
- consulter les disponibilités des formateurs.

Un organisme ne peut jamais consulter les données confidentielles d'un autre organisme.

---

# Le principe de propriété

Chaque donnée possède un propriétaire.

Le propriétaire détermine :

- qui peut modifier la donnée ;
- qui peut la consulter ;
- qui peut la supprimer.

Cette règle est fondamentale dans toute l'application.

---

# L'agenda du formateur

Le calendrier affiché dans TimeForma représente un agenda.

Cet agenda est composé de plusieurs types d'événements.

Exemples :

- disponibilité
- indisponibilité
- vacances
- mission
- formation personnelle

Chaque événement possède son propre propriétaire.

---

# Disponibilités

Les disponibilités appartiennent au formateur.

Le formateur peut :

- les créer ;
- les modifier ;
- les supprimer.

Les organismes peuvent les consulter.

Ils ne peuvent pas les modifier.

---

# Missions

Les missions appartiennent à l'organisme qui les crée.

Une mission est visible :

- par le formateur concerné ;
- par l'organisme propriétaire.

Les autres organismes ne voient jamais les détails d'une mission.

Ils voient uniquement que le créneau est occupé.

---

# Calendrier affiché

Le calendrier visible dépend de l'utilisateur connecté.

Le logiciel construit dynamiquement l'affichage en combinant :

- les disponibilités du formateur ;
- les missions appartenant à l'organisme connecté ;
- les indisponibilités provenant des autres organismes.

---

# Confidentialité

Le logiciel protège les informations commerciales.

Un organisme ne doit jamais connaître :

- les clients d'un autre organisme ;
- les lieux d'intervention ;
- les tarifs ;
- les commentaires internes.

---

# Philosophie

TimeForma privilégie :

- la simplicité ;
- la confidentialité ;
- la collaboration ;
- la réutilisation des données.

Chaque nouvelle fonctionnalité devra respecter ces principes.