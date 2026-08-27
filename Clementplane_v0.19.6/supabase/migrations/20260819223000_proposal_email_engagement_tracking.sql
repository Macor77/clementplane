-- ==========================================================
-- FORMAPLANE — SPRINT 11.5.2 — FINALISATION
-- Suivi indépendant : délivré / ouvert / cliqué
-- ==========================================================

alter table public.email_logs
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz;

create index if not exists email_logs_opened_at_idx
  on public.email_logs(opened_at)
  where opened_at is not null;

create index if not exists email_logs_clicked_at_idx
  on public.email_logs(clicked_at)
  where clicked_at is not null;
