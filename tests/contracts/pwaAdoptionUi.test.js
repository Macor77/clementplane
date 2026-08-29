import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Sprint 20 PWA adoption UI', () => {
  it('offers a direct Clementplane install action to authenticated users', () => {
    const source = read('src/components/pwa/PwaManager.jsx');
    expect(source).toMatch(/session\?\.user/);
    expect(source).toMatch(/Installer Clementplane/);
    expect(source).toMatch(/deferredPrompt\.prompt\(\)/);
    expect(source).toMatch(/Partager/);
    expect(source).toMatch(/isMobileDevice/);
    expect(source).not.toMatch(/showInstallHint && !needRefresh && \(deferredPrompt \|\| ios\)/);
  });

  it('automatically applies PWA updates to avoid stale frontend versions', () => {
    const source = read('src/components/pwa/PwaManager.jsx');
    expect(source).toMatch(/updateServiceWorker\(true\)/);
    expect(source).toMatch(/useEffect[\s\S]*needRefresh[\s\S]*updateServiceWorker\(true\)/);
    expect(source).not.toMatch(/setNeedRefresh\(false\)/);
  });

  it('tracks authenticated openings with pwa or browser access mode', () => {
    const source = read('src/components/pwa/PwaManager.jsx');
    expect(source).toMatch(/trackProductEvent\('app_opened'/);
    expect(source).toMatch(/access_mode/);
  });

  it('shows PWA adoption and access split in the admin dashboard', () => {
    const admin = read('src/pages/admin/AdminApp.jsx');
    const service = read('src/services/adminService.js');
    expect(admin).toMatch(/Application mobile \/ PWA/);
    expect(admin).toMatch(/Utilisateurs ayant lancé la PWA/);
    expect(admin).toMatch(/Navigateur · 30 derniers jours/);
    expect(service).toMatch(/admin_pwa_stats/);
  });
});
