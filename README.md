# TimeForma

**Version : 4.0**  
**Dernière mise à jour : 14/07/2026**  
**Correspond au Sprint 5 terminé**

---

# Présentation

TimeForma est une application web développée par **Alter Prévention**.

Son objectif est de permettre à un organisme de formation de retrouver, comparer et planifier rapidement les formateurs les plus adaptés à une mission.

Le projet est développé selon une logique **Product First** :

- résoudre les besoins quotidiens d'Alter Prévention ;
- construire progressivement les fondations d'une plateforme SaaS ;
- conserver une architecture simple, évolutive et maintenable.

---

# Fonctionnalités actuelles

## Gestion des formateurs

- Création
- Modification
- Consultation
- Suppression

Chaque fiche contient notamment :

- identité
- coordonnées
- adresse
- compétences
- matériel
- tarif
- statut
- notes internes
- coordonnées GPS

---

## Disponibilités

Chaque formateur possède un calendrier mensuel permettant de renseigner :

- Disponible
- Indisponible
- Non renseigné

Une journée peut contenir plusieurs notes.

Le planning est partagé dans le listing afin de comparer plusieurs formateurs en un seul écran.

---

## Recherche

Le listing permet notamment :

- recherche multicritères
- tri des colonnes
- filtres
- calcul des distances
- affichage du planning mensuel
- recherche des disponibilités

---

## Géolocalisation

TimeForma calcule automatiquement la distance entre :

- un lieu de formation
- les formateurs

Le géocodage est assuré par une **Edge Function Supabase**.

Le navigateur n'appelle jamais directement Nominatim.

Flux :

```
Navigateur
      │
      ▼
Edge Function Supabase
      │
      ▼
Nominatim
      │
      ▼
Coordonnées GPS
```

Lors d'une recherche, TimeForma affiche le lieu réellement reconnu.

Exemple :

```
📍 Lieu reconnu

Chelles, Seine-et-Marne (77500)
```

---

# Stack technique

## Frontend

- React
- Vite

## Backend

- Supabase
- PostgreSQL

## Cartographie

- Leaflet
- OpenStreetMap
- Nominatim

## Déploiement

- GitHub
- Vercel

---

# Architecture

Le projet repose sur une séparation stricte :

```
Pages
      │
      ▼
Hooks
      │
      ▼
Services
      │
      ▼
Supabase
```

Les responsabilités sont réparties ainsi :

## Pages

Orchestration uniquement.

## Hooks

Logique métier.

## Services

Accès aux données.

## Components

Affichage.

---

# Installation

```bash
npm install
```

Lancement :

```bash
npm run dev
```

Compilation :

```bash
npm run build
```

---

# Déploiement

Le déploiement est automatique.

```
GitHub
      │
      ▼
Vercel
```

Chaque `git push` déclenche un nouveau déploiement.

---

# Edge Functions

Les Edge Functions sont stockées dans :

```
supabase/functions/
```

Déploiement :

```bash
npx supabase functions deploy geocode
```

---

# Documentation

Toute la documentation du projet est disponible dans :

```
docs/
```

- ARCHITECTURE.md
- DATABASE.md
- DECISIONS.md
- FONCTIONNEL.md
- PRD.md
- ROADMAP.md
- CHANGELOG.md

---

# Philosophie

Le projet suit quelques règles simples :

- simplicité avant sophistication ;
- lisibilité avant optimisation prématurée ;
- séparation claire des responsabilités ;
- architecture évolutive ;
- documentation systématiquement mise à jour après chaque sprint important.

---

# État actuel

**Sprint 5 terminé**

Le logiciel dispose désormais :

- gestion des formateurs
- disponibilités
- planning mensuel
- géolocalisation
- calcul des distances
- géocodage via Edge Functions
- recherche multicritères
- filtres
- architecture refactorisée

Le prochain objectif est le **Sprint 6 : Gestion des missions**.