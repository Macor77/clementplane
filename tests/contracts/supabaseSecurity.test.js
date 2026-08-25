import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const missionsRls = read('supabase/migrations/20260811170000_missions_multi_organization.sql');
const orgTrainers = read('supabase/migrations/20260811140000_create_organization_trainers.sql');
const orgTrainersHardening = read('supabase/migrations/20260814161000_harden_organization_trainers_privileges.sql');
const assignment = read('supabase/migrations/20260820143000_revalidation_assignment_closure.sql');

describe('Contrats SQL — cloisonnement multi-organismes', () => {
  it.each(['missions', 'mission_dates', 'mission_formateurs'])(
    'RLS reste activée sur %s',
    (table) => {
      expect(missionsRls.toLowerCase()).toContain(
        `alter table public.${table}\nenable row level security`,
      );
    },
  );

  it('les quatre opérations mission restent limitées aux membres de l’OF', () => {
    expect(missionsRls).toContain('Organization members can read missions');
    expect(missionsRls).toContain('Organization members can create missions');
    expect(missionsRls).toContain('Organization members can update missions');
    expect(missionsRls).toContain('Organization members can delete missions');
    expect(missionsRls.match(/public\.is_organization_member\(/g)?.length ?? 0)
      .toBeGreaterThanOrEqual(12);
  });

  it('le RPC de disponibilités globales exige une authentification et ne révèle que les engagements utiles', () => {
    expect(missionsRls).toContain('public.get_trainer_mission_commitments_safe');
    expect(missionsRls).toContain("raise exception 'AUTH_REQUIRED'");
    expect(missionsRls).toContain("mf.statut in (\n      'accepte',\n      'affecte'\n    )");
    expect(missionsRls).toContain('to authenticated;');
  });

  it('le réseau privé OF reste sous RLS', () => {
    expect(orgTrainers.toLowerCase()).toContain(
      'alter table public.organization_trainers\nenable row level security',
    );
    expect(orgTrainers).toContain('Organization members can read organization trainers');
    expect(orgTrainers).toContain('Organization members can add trainers');
    expect(orgTrainers).toContain('Organization members can update organization trainers');
    expect(orgTrainers).toContain('Organization members can remove trainers');
  });

  it('anon ne possède aucun droit direct sur organization_trainers', () => {
    expect(orgTrainersHardening).toContain(
      'revoke all\non table public.organization_trainers\nfrom anon;',
    );
  });

  it("l'affectation atomique reste SECURITY INVOKER et ferme les autres candidats", () => {
    expect(assignment.toLowerCase()).toContain('security invoker');
    expect(assignment).toContain("statut = 'mission_pourvue'");
    expect(assignment).toContain("statut = 'affecte'");
    expect(assignment).toContain("and mf.statut in ('accepte', 'affecte')");
    expect(assignment).toContain('to authenticated;');
  });
});
