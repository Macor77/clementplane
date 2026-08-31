import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const migrationPath = 'supabase/migrations/20260831140000_admin_improvements_register.sql';

describe('Sprint 20.6 — registre Admin des améliorations', () => {
  it('réserve la table et ses opérations aux administrateurs de plateforme', () => {
    const sql = read(migrationPath);
    expect(sql).toMatch(/alter table public\.admin_improvement_items enable row level security/i);
    expect(sql).toMatch(/revoke all on table public\.admin_improvement_items from anon, authenticated/i);
    expect(sql.match(/if not public\.is_platform_admin\(\)/gi)?.length).toBeGreaterThanOrEqual(4);
    expect(sql).toMatch(/revoke all on function public\.admin_delete_improvement_item\(uuid\) from public, anon/i);
  });

  it('enregistre et retire automatiquement la date de résolution selon le statut', () => {
    const sql = read(migrationPath);
    expect(sql).toMatch(/case when p_status = 'completed' then coalesce\(completed_at, now\(\)\) else null end/i);
  });
});
