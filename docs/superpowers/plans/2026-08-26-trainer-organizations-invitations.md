# Mes OF & invitations organisme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le carnet central « Mes OF », l’invitation OF avec cooldown serveur 7 jours et la redirection de l’OF invité vers la fiche du formateur.

**Architecture:** Réutiliser `trainer_availability_contacts` comme source unique. Enrichir les contacts via RPC, réserver/journaliser les invitations dans `email_logs`, envoyer via l’Edge Function existante, puis propager le token dans les écrans d’inscription/connexion. Ouvrir la fiche d’un formateur revendiqué hors réseau avec CTA d’ajout.

**Tech Stack:** React 19, React Router, Supabase PostgreSQL/RPC/RLS, Supabase Edge Functions, Brevo, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-trainer-organizations-invitations-design.md`

## Global Constraints
- Cooldown invitation : 7 jours complets, contrôlé côté serveur.
- Cooldown partage disponibilités existant : 20 jours, inchangé.
- `trainer_availability_contacts` reste l’unique carnet OF du formateur.
- Aucun annuaire public d’OF n’est exposé.
- Les données internes OF d’une relation ne sont jamais affichées avant ajout au réseau.

---

### Task 1: Modèle serveur et RPC
**Files:** migration Sprint 19.
- [ ] Ajouter le statut Formaplane/référencement/invitation par contact.
- [ ] Ajouter la réservation atomique d’invitation 7 jours dans `email_logs`.
- [ ] Ajouter la résolution publique minimale d’un token d’invitation.

### Task 2: Service et page Mes OF
**Files:** `src/services/trainerOrganizationsService.js`, `src/pages/trainer/TrainerOrganizations.jsx`, `TrainerApp.jsx`.
- [ ] Écrire les tests unitaires des helpers d’invitation puis vérifier leur échec.
- [ ] Ajouter le service central du carnet.
- [ ] Construire la page CRUD + statuts + CTA invitation.
- [ ] Ajouter le menu et la route.

### Task 3: Partage des disponibilités
**Files:** `TrainerAvailabilityShare.jsx`.
- [ ] Lire le carnet via le service central.
- [ ] Faire pointer la modale pédagogique vers `Mes OF`.
- [ ] Retirer le formulaire CRUD du carnet de cette page pour éviter deux lieux de gestion.

### Task 4: E-mail d’invitation et parcours public
**Files:** Edge Function, `emailService.js`, `OrganizationInvitationLanding.jsx`, `OrganizationSignup.jsx`, `organizationSignupService.js`, `Login.jsx`, `App.jsx`.
- [ ] Ajouter le type `trainer_organization_invitation` à l’Edge Function.
- [ ] Utiliser le journal pré-réservé et envoyer le CTA vers `/invitation-of/:token`.
- [ ] Préserver le token à travers inscription/confirmation/connexion.

### Task 5: Fiche formateur hors réseau
**Files:** `FormateurView.jsx`, `TrainerSearch.jsx`.
- [ ] Autoriser la consultation d’un profil revendiqué hors réseau.
- [ ] Masquer les données/actions internes sans relation.
- [ ] Ajouter `Ajouter à mon réseau`.
- [ ] Permettre d’ouvrir la fiche depuis la recherche.

### Task 6: Vérification
- [ ] Exécuter tests ciblés.
- [ ] Exécuter `npm test`.
- [ ] Exécuter `npm run build`.
- [ ] Exécuter `npm run lint` et rapporter séparément les éventuelles dettes préexistantes.
