# PRD — Clementplane

Version : 0.20
Dernière mise à jour : 27/08/2026
État produit après le Sprint 20 terminé et validé.

---

# Présentation

Clementplane est une plateforme de gestion des formateurs destinée aux organismes de formation.

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

Clementplane doit devenir le point d'entrée unique de la gestion des formateurs.

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

Clementplane permet :

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

# Fonctionnalités disponibles

Clementplane dispose notamment de :

- création et suivi des missions ;
- recherche et sélection de formateurs depuis une mission ;
- propositions, acceptations et refus ;
- gestion de plusieurs options concurrentes ;
- affectation définitive et prévention des doubles affectations ;
- espace formateur autonome ;
- authentification et espaces multi-rôles ;
- réseau partagé entre plusieurs organismes avec confidentialité ;
- revendication d'un profil formateur ;
- historiques des disponibilités et des actions mission ;
- désistement et désaffectation ;
- revalidation après modification des conditions d'une mission ;
- référentiels de compétences et de matériel ;
- plannings OF et formateur.


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

Clementplane sera considéré comme un succès lorsque :

- un organisme pourra préparer une mission en quelques minutes ;
- la recherche d'un formateur deviendra quasi instantanée ;
- les doubles affectations seront évitées automatiquement ;
- les informations seront centralisées dans un seul outil.

---

# Vision long terme

À terme, Clementplane deviendra une plateforme collaborative reliant :

- les organismes de formation ;
- les formateurs indépendants ;
- les missions.

L'objectif n'est pas uniquement de gérer des données, mais de faciliter l'organisation des formations.

---


---

# État produit — v0.20.0

Après le Sprint 20, Clementplane dispose notamment des fonctionnalités suivantes :

- comptes OF, Formateur et double profil ;
- réseaux privés de formateurs par organisme ;
- profils formateurs revendiqués ;
- disponibilités et planning ;
- recherche par disponibilité, distance, compétences et critères métier ;
- création et suivi des missions ;
- propositions, réponses, options et affectations ;
- gestion des principaux événements du cycle de vie des missions ;
- partage des disponibilités avec protection anti-spam côté serveur ;
- carnet de contacts et invitations OF ;
- e-mails transactionnels ;
- espace Admin, statistiques et mini-CRM ;
- page Découvrir avec FAQ, tutoriels et contact ;
- landing page publique ;
- expérience mobile optimisée ;
- PWA installable sur Android et iPhone/iPad ;
- suivi Admin de l’adoption PWA.

## Principe produit

Clementplane doit réduire les doubles saisies et devenir une source de référence commune entre organismes et formateurs, tout en conservant la confidentialité des données propres à chaque organisme.

## Priorité après v0.20.0

Le Sprint 21 doit permettre au formateur de créer lui-même une mission dans son agenda lorsqu’elle lui est confiée par un organisme qui n’utilise pas Clementplane.

L’objectif est que Clementplane puisse devenir son planning professionnel de référence, même lorsqu’il travaille avec des organismes extérieurs à la plateforme.

Le Sprint 22 est consacré à la synchronisation des missions Clementplane vers Google Agenda.
