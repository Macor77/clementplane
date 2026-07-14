# FONCTIONNEL - TimeForma

Version : 4.0  
Dernière mise à jour : 14/07/2026  
Correspond au Sprint 5 terminé.

---

# Objectif

Ce document décrit le comportement fonctionnel attendu de TimeForma.

Il définit **ce que doit faire le logiciel**, indépendamment de son implémentation technique.

La référence technique est décrite dans `ARCHITECTURE.md`.

---

# Vision

TimeForma permet à un organisme de formation de retrouver rapidement le formateur le plus adapté à une mission.

Le logiciel centralise :

- les informations des formateurs ;
- leurs disponibilités ;
- leur localisation ;
- leurs compétences ;
- leurs futurs engagements.

---

# Gestion des formateurs

Chaque formateur possède une fiche contenant notamment :

- prénom
- nom
- email
- téléphone
- adresse
- code postal
- ville
- coordonnées GPS
- compétences
- matériel
- tarif
- statut
- notes internes

L'utilisateur peut :

- créer
- consulter
- modifier
- supprimer

une fiche.

---

# Recherche

Le listing constitue l'écran principal du logiciel.

Il permet :

- la recherche multicritères ;
- le tri des colonnes ;
- le calcul des distances ;
- la consultation du planning ;
- l'accès rapide aux fiches.

---

# Recherche géographique

L'utilisateur saisit :

```
Chelles
```

Puis clique sur :

```
Calculer les distances
```

Le logiciel :

- géocode le lieu ;
- calcule les distances ;
- trie automatiquement les résultats.

Le lieu reconnu est affiché.

Exemple :

```
📍 Lieu reconnu

Chelles, Seine-et-Marne (77500)
```

Cette information permet de vérifier immédiatement que le bon lieu a été utilisé.

---

# Coordonnées GPS

Chaque formateur possède :

- latitude
- longitude

Lorsqu'elles sont absentes, TimeForma peut les compléter automatiquement.

Le logiciel utilise successivement :

- adresse complète ;
- code postal + ville ;
- ville seule.

---

# Disponibilités

Les disponibilités sont gérées **à la journée**.

Chaque journée possède :

- un statut ;
- plusieurs notes éventuelles.

---

# Statuts

Les statuts disponibles sont :

- Disponible
- Indisponible
- Non renseigné

Le statut **Mission** est réservé au système.

Il ne peut jamais être sélectionné manuellement.

---

# Notes

Une journée peut contenir plusieurs notes.

Chaque ligne représente une information indépendante.

Exemples :

- Disponible uniquement après 14 h
- Disponible en distanciel
- Préférer les missions en Île-de-France

---

# Planning

Le planning est affiché directement dans le listing.

Tous les formateurs utilisent la même période.

Les jours sont parfaitement alignés.

Le changement de mois est global.

---

# Affichage du planning

Chaque cellule peut afficher :

- la couleur du statut ;
- un point noir lorsqu'une note existe.

Au survol :

- statut ;
- notes ;
- date.

---

# Distances

Les distances sont calculées uniquement après une action volontaire de l'utilisateur.

Aucun calcul automatique n'est lancé pendant la saisie.

Le tri par distance devient alors disponible.

---

# Missions (Sprint 6)

Le prochain module permettra :

- créer une mission ;
- affecter un formateur ;
- réserver automatiquement les dates ;
- éviter les doubles affectations.

Lorsqu'une mission est créée :

- le planning du formateur est mis à jour ;
- le statut Mission apparaît automatiquement.

---

# Confidentialité

Chaque organisme ne doit accéder qu'à ses propres données.

Les informations confidentielles (missions, clients, notes internes...) ne seront jamais visibles par un autre organisme.

Cette règle sera renforcée lors du passage en SaaS.

---

# Philosophie

TimeForma privilégie toujours :

- la simplicité ;
- la rapidité ;
- la lisibilité ;
- l'efficacité.

Chaque nouvelle fonctionnalité doit permettre à un organisme de préparer plus rapidement une mission, sans complexifier inutilement l'interface.