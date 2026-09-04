import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const migrationPath =
  'supabase/migrations/20260904050233_fix_admin_list_accounts_status.sql';

describe('Admin — liste des utilisateurs', () => {
  it('ne dépend plus de profiles.account_status et calcule le statut depuis auth.users', () => {
    const sql = fs.readFileSync(path.join(root, migrationPath), 'utf8');

    expect(sql).not.toMatch(/p\.account_status/i);
    expect(sql).toMatch(/u\.deleted_at/i);
    expect(sql).toMatch(/u\.banned_until/i);
    expect(sql).toMatch(/else 'active'/i);
  });

  it('conserve la protection administrateur de plateforme', () => {
    const sql = fs.readFileSync(path.join(root, migrationPath), 'utf8');

    expect(sql).toMatch(/if not public\.is_platform_admin\(\)/i);
    expect(sql).toMatch(/raise exception 'ADMIN_REQUIRED'/i);
  });
});
