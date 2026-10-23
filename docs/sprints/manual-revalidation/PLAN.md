# Confirmation manuelle — Implementation Plan

**Goal:** enregistrer l’accord reçu hors application, quel que soit le canal initial.
**Architecture:** RPC atomique dédiée ; formulaire React réutilisant la lecture de revalidation et l’historique existants.
**Tech Stack:** React, PostgreSQL/Supabase, Vitest, PGlite, Playwright.
**Spec:** DESIGN.md

## Contraintes et revue
Accord individuel explicite, accès OF actif seulement, pas de mail, conservation affectation, pas d’écrasement d’une réponse précédente. Tester anonymes/OF tiers, relation retirée, mission annulée, plusieurs réponses et lien périmé. Erreur réseau : formulaire conservé, aucun succès anticipé.

## Tâches
- [x] Test SQL local sur schéma minimal et fonctions réelles : succès, droits, état périmé, journal, multi-formateurs, anciens liens.
- [x] RPC confirm_mission_change_for_organization(p_request_id uuid, p_trainer_id uuid, p_channel text, p_note text) returns text ; privilèges restreints et vérifications explicites.
- [x] Service confirmMissionChangeForOrganization et composant de confirmation sur MissionDetail ; historique OF ; page publique traitée.
- [x] Tests navigateur desktop/mobile avec API fictive ; tests, lint, SQL, build/audit et CI.
- [x] Revue indépendante, livraison dans le mandat, documentation de clôture et limites vérifiées.
