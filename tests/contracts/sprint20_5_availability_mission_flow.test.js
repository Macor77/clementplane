import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const migration = read('supabase/migrations/20260829090000_availability_scope_and_mission_conflicts.sql');
const declaredStatusMigration = read('supabase/migrations/20260829095000_availability_declared_status.sql');
const priorityMigration = read('supabase/migrations/20260829101500_fix_availability_latest_change.sql');
const missionDetail = read('src/pages/MissionDetail.jsx');
const formateurView = read('src/pages/FormateurView.jsx');
const missionsService = read('src/services/missionsService.js');

describe('Sprint 20.5 — disponibilités OF / formateur', () => {
  it('sépare les disponibilités locales OF des disponibilités globales du formateur', () => {
    expect(migration).toMatch(/create table if not exists public\.organization_trainer_availability/);
    expect(migration).toMatch(/organization_id uuid not null/);
    expect(migration).toMatch(/trainer_id uuid not null/);
    expect(migration).toMatch(/unique \(organization_id, trainer_id, day\)/);
  });

  it('expose aux OF une disponibilité effective avec priorité au formateur lorsqu’elle est renseignée', () => {
    expect(migration).toMatch(/get_organization_trainer_availability/);
    expect(migration).toMatch(/when ta\.id is not null[\s\S]*coalesce\(ta\.status, ''\) <> ''[\s\S]*then ta\.status/);
    expect(migration).toMatch(/left join public\.organization_trainer_availability ota/);
  });

  it('ne laisse plus la table globale des disponibilités en lecture directe publique', () => {
    expect(migration).toMatch(/revoke select[\s\S]*on table public\.trainer_availability[\s\S]*from anon, authenticated/);
  });

  it('autorise la sélection d’un formateur indisponible pour proposer une mission', () => {
    expect(missionDetail).not.toMatch(/disabled=\{[\s\S]*trainer\.availability[\s\S]*status === 'unavailable'[\s\S]*\}/);
  });

  it('ne bloque plus l’affectation sur une autre mission déjà affectée', () => {
    expect(missionsService).not.toMatch(/await assertTrainerCanBeAffected\(/);
    expect(missionsService).toMatch(/if \(statut === 'affecte'\)[\s\S]*assign_mission_trainer/);
  });

  it('ne reconcilie plus les propositions acceptées en statut indisponible automatique', () => {
    expect(migration).toMatch(/reconcile_trainer_conflicts_safe/);
    expect(migration).toMatch(/-- No automatic proposal status mutation anymore\.[\s\S]*return;/);
  });
  it('utilise la déclaration la plus récente comme état effectif', () => {
    expect(priorityMigration).toMatch(
      /ta\.updated_at[\s\S]*ota\.updated_at/
    );
    expect(priorityMigration).toMatch(/ta\.updated_at\s*>=\s*ota\.updated_at/);
  });

  it('conserve la déclaration locale de l’OF indépendamment de l’état effectif', () => {
    expect(declaredStatusMigration).toMatch(
      /coalesce\(ota\.status, ''\)\s+as\s+declared_status/
    );
  });

  it('consomme le résultat des disponibilités comme un tableau', () => {
    expect(formateurView).not.toMatch(
      /for\s*\(\s*const row of\s*availabilityResult\.data\s*\|\|\s*\[\]/
    );
    expect(formateurView).toMatch(
      /for\s*\(\s*const row of\s*availabilityResult\s*\|\|\s*\[\]/
    );
  });

  it('laisse l’OF réaffirmer sa déclaration quand l’état effectif vient du formateur', () => {
    expect(formateurView).toMatch(/effectiveStatus/);
    expect(formateurView).toContain("currentStatus === option.value &&");
  });

});
