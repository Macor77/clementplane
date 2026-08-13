# PRD - Formaplane

Version : 4.0  
Dernière mise à jour : 14/07/2026  
Correspond au Sprint 5 terminé.

---

# Présentation

Formaplane est une plateforme de gestion des formateurs destinée aux organismes de formation.

Son objectif est de réduire drastiquement le temps nécessaire pour :

- trouver un formateur ;
- vérifier ses disponibilités ;
- connaître ses compétences ;
- calculer sa proximité avec une mission ;
- affecter le bon formateur.

Le logiciel est développé en priorité pour Alter Prévention, avec une architecture pensée dès aujourd'hui pour une future commercialisation en SaaS.

---

# Le problème

Aujourd'hui, la majorité des organismes gèrent leurs formateurs avec :

- Excel ;
- Outlook ;
- des agendas papier ;
- des fichiers dispersés ;
- leur mémoire.

Les principales difficultés sont :

- retrouver un formateur compétent ;
- savoir s'il est disponible ;
- connaître sa localisation ;
- éviter les doubles affectations ;
- conserver un historique.

---

# Notre vision

Formaplane doit devenir le point d'entrée unique de la gestion des formateurs.

À terme, un organisme ne devra plus avoir besoin de plusieurs outils.

Le logiciel devra couvrir :

- le réseau de formateurs ;
- les disponibilités ;
- les missions ;
- les documents ;
- les échanges ;
- les statistiques.

---

# Public cible

## Aujourd'hui

- Alter Prévention

## Demain

- Organismes de formation
- Responsables pédagogiques
- Coordinateurs
- Planificateurs
- Assistants administratifs

## Plus tard

- Formateurs indépendants
- Administrateurs de plateforme

---

# Proposition de valeur

Formaplane permet :

- de trouver rapidement le bon formateur ;
- de comparer plusieurs profils ;
- de centraliser les informations ;
- de gagner du temps ;
- de réduire les erreurs de planification.

---

# Fonctionnalités disponibles

## Gestion des formateurs

- création
- modification
- suppression
- consultation

---

## Planning

- disponibilités journalières
- notes
- vue mensuelle
- comparaison des formateurs

---

## Recherche

- recherche multicritères
- tri
- filtres
- calcul des distances
- géolocalisation

---

## Géocodage

Le calcul des distances repose sur une Edge Function Supabase.

Le logiciel indique toujours le lieu réellement reconnu.

---

# Fonctionnalités futures

Les prochaines grandes étapes sont :

- Missions
- Réseau de formateurs
- Comptes utilisateurs
- Marketplace
- SaaS multi-organismes

Le détail est disponible dans :

```
ROADMAP.md
```

---

# Principes produit

Chaque fonctionnalité doit répondre à au moins un de ces objectifs :

- faire gagner du temps ;
- réduire les manipulations ;
- améliorer la qualité des décisions ;
- limiter les erreurs ;
- préparer les évolutions futures.

Une fonctionnalité qui n'apporte aucune valeur métier ne doit pas être développée.

---

# Critères de réussite

Formaplane sera considéré comme un succès lorsque :

- un organisme pourra préparer une mission en quelques minutes ;
- la recherche d'un formateur deviendra quasi instantanée ;
- les doubles affectations seront évitées automatiquement ;
- les informations seront centralisées dans un seul outil.

---

# Vision long terme

À terme, Formaplane deviendra une plateforme collaborative reliant :

- les organismes de formation ;
- les formateurs indépendants ;
- les missions.

L'objectif n'est pas uniquement de gérer des données, mais de faciliter l'organisation des formations.