# Google Agenda — Implementation Plan

> Exécution : superpowers:executing-plans, développement dans cette session et revue indépendante finale.

**Goal:** synchroniser les engagements réels du formateur dans son calendrier Google dédié.
**Architecture:** projection pure, connecteur Google, persistance/queue SQL, Edge Functions et interface React.
**Tech Stack:** React/Vite, Supabase Postgres/Edge, JS partagé, WebCrypto ; pas de nouvelle dépendance.
**Spec:** docs/sprints/v1.2/DESIGN.md et cahier des charges fourni.

## Global Constraints
- Aucune migration, vraie mission, notification, fusion ou publication en production.
- calendar.app.created, openid, email ; jamais Gmail/lecture des agendas personnels.
- Les options d'export tarif/notes sont initialement false. Tous événements privés, sans invités.
- Les secrets restent serveur. Données fictives pour tests et captures.
- Les migrations antérieures ne sont pas rejouées ni renumérotées.

## Review Focus
- Course entre déconnexion, réglage de confidentialité, deux workers et OAuth.
- Réponse HTTP perdue après création Google (événement ou calendrier).
- Supprimer un événement manuellement puis réconcilier sans doublon.
- Ancienne mission sans horaires ou en revalidation avec nouvelles dates.
- Réconciliation partielle/erreur source : jamais considérer un résultat incomplet comme une suppression.

### Task 1: Projection et provider
Files: supabase/functions/_shared/calendar/{projection,google,crypto,sync}.js ; tests/calendar/*.test.js.
Interfaces: projectEvents(rows, options) → Map ; GoogleCalendar(fetch,token,calendarId) → get/insert/update/remove ; reconcile(provider,store,desired).
- [ ] Écrire les tests des statuts, revalidation, confidentialité, dates/DST, IDs, quota, tombstones, collisions ; constater RED.
- [ ] Implémenter les fonctions sans dépendre de React/Deno.
- [ ] Run npm test -- tests/calendar ; attendu : PASS. Commit.

### Task 2: Base et file durable
Files: nouvelle migration google_calendar_sync ; scripts/testing/calendar-sync-sql.mjs.
Interfaces: tables calendar_connections/oauth_states/events ; RPC claim, lock, finish, source snapshot ; accès service_role uniquement.
- [ ] Créer fixture Postgres isolée et assertions accès, claim concurrent, invalidation, export explicite ; constater RED.
- [ ] Migration additive, triggers sans HTTP, activation cron en script séparé.
- [ ] Run node scripts/testing/calendar-sync-sql.mjs ; attendu : PASS. Commit.

### Task 3: OAuth et traitement autonome
Files: fonctions google-calendar et google-calendar-worker, shared orchestration.
Interfaces: POST action authentifié utilisateur ; worker secret dédié et aucune identité client.
- [ ] Tester state lié/usage unique, refus d'accès, scopes, chiffrement, expiration, isolation ; constater RED.
- [ ] Brancher provider, RPC, verrou, délais et reprises, déconnexion, reconnexion même compte.
- [ ] Run npm test -- tests/calendar et tests SQL ; attendu : PASS. Commit.

### Task 4: Interface et documentation
Files: GoogleCalendarCard, service, callback statique, TrainerSettings, PWA, public landing, FAQ, docs RGPD/exploitation.
Interfaces: API d'état sans secrets ; activation explicite flag préproduction.
- [ ] Ajouter recette Playwright simulée desktop/mobile/PWA pour connexion, réglages, reprise/déconnexion.
- [ ] Implémenter les parcours et textes ; ne pas annoncer Google disponible publiquement.
- [ ] Run test, lint, build, SQL, Playwright ; attendu : PASS ou blocage externe précisément consigné.
- [ ] Recette Google réelle si accès autorisés disponibles ; sinon la déclarer non réalisée.
- [ ] Commit, revue indépendante, corrections, pousser branche et PR brouillon, archive et retour pilotage.
