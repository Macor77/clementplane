import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260921044456_tutorial_analytics.sql',
);
const adminPath = path.join(process.cwd(), 'src/pages/admin/AdminApp.jsx');

describe('tutorial analytics migration', () => {
  it('allows authenticated tutorial interactions without widening function access', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toMatch(/tutorial_interaction/);
    expect(sql).toMatch(/create-mission/);
    expect(sql).toMatch(/accept-and-assign/);
    expect(sql).toMatch(/v_step < 1 or v_step > v_total_steps/);
    expect(sql).toMatch(/v_total_steps < 1 or v_total_steps > 7/);
    expect(sql).toMatch(/auth\.uid\(\) is null/);
    expect(sql).toMatch(/grant execute on function public\.track_product_event\(text,text,jsonb\) to authenticated/i);
    expect(sql).not.toMatch(/grant execute[^;]+to anon/i);
  });

  it('labels tutorial usage in the admin statistics', () => {
    const source = fs.readFileSync(adminPath, 'utf8');
    expect(source).toMatch(/tutorial_interaction:'Tutoriels'/);
  });
});
