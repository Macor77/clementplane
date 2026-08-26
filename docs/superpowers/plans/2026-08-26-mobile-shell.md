# Mobile Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la navigation horizontale mobile actuelle par un header compact et un drawer partagé entre les espaces OF et Formateur.

**Architecture:** Créer un composant `MobileNavigation` commun qui reçoit l'espace actif, les items de navigation, le contenu footer et gère ouverture/fermeture. Les deux shells existants conservent leur sidebar desktop et ajoutent le composant mobile. Les media queries CSS basculent à 720 px.

**Tech Stack:** React 19, React Router 7, CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-mobile-shell-design.md`

## Global Constraints
- Aucun changement fonctionnel desktop à partir de 721 px.
- Breakpoint mobile : 720 px et moins.
- Zones tactiles principales : au moins 44 px.
- Le drawer doit se fermer au changement de route, sur overlay, bouton fermer et Échap.
- Aucun ajout de dépendance.

---

### Task 1: MobileNavigation partagé

**Files:**
- Create: `src/components/layout/MobileNavigation.jsx`
- Test: `src/components/layout/__tests__/MobileNavigation.test.jsx`

**Interfaces:**
- Consumes: `spaceLabel`, `navigationItems`, `footer`, `brandSrc`.
- Produces: composant React `MobileNavigation`.

- [ ] Écrire un test de rendu qui échoue tant que le composant n'existe pas.
- [ ] Exécuter le test et confirmer l'échec attendu.
- [ ] Implémenter le header, l'overlay, le drawer et les fermetures.
- [ ] Exécuter le test et confirmer qu'il passe.

### Task 2: Brancher les shells OF et Formateur

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/trainer/TrainerApp.jsx`

**Interfaces:**
- Consumes: `MobileNavigation`.
- Produces: navigation mobile cohérente dans les deux espaces.

- [ ] Ajouter `MobileNavigation` à l'espace OF avec `UserCard` dans le footer.
- [ ] Ajouter `MobileNavigation` à l'espace Formateur avec identité et actions existantes dans le footer.
- [ ] Vérifier que les routes desktop restent inchangées.

### Task 3: CSS responsive du shell

**Files:**
- Modify: `src/App.css`

**Interfaces:**
- Consumes: classes `mobile-navigation*`.
- Produces: sidebar desktop masquée à <=720 px, header/drawer visibles, contenu pleine largeur.

- [ ] Remplacer l'ancien menu horizontal <=720 px par les styles du header/drawer.
- [ ] Ajouter overlay, animations légères, hauteur tactile et gestion du contenu principal.
- [ ] Vérifier 360, 390, 430 et desktop via CSS/layout.

### Task 4: Vérification

**Files:**
- No production changes expected.

- [ ] Exécuter le test ciblé.
- [ ] Exécuter `npm test`.
- [ ] Exécuter `npm run build`.
- [ ] Exécuter `npm run lint` et rapporter séparément tout passif existant.
