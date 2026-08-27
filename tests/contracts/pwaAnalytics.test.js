import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260827113000_sprint20_pwa_analytics.sql');

describe('Sprint 20 PWA analytics migration', () => {
  it('extends product analytics with authenticated app openings', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toMatch(/app_opened/);
    expect(sql).toMatch(/access_mode/);
  });

  it('adds PWA adoption and 30-day access split to admin stats', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toMatch(/admin_pwa_stats/);
    expect(sql).toMatch(/pwa_users_total/);
    expect(sql).toMatch(/pwa_openings_30d/);
    expect(sql).toMatch(/browser_openings_30d/);
  });
});
