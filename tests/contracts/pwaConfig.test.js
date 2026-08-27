import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PWA_OPTIONS } from '../../pwa.config.js';

describe('Clementplane PWA configuration', () => {
  it('declares an installable standalone Clementplane manifest', () => {
    expect(PWA_OPTIONS.manifest).toMatchObject({
      name: 'Clementplane',
      short_name: 'Clementplane',
      lang: 'fr-FR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: '#0B132B',
      background_color: '#0B132B',
    });
  });

  it('declares the validated 192 and 512 Clementplane icons', () => {
    expect(PWA_OPTIONS.manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: '/icons/clementplane-icon-192.png', sizes: '192x192' }),
      expect.objectContaining({ src: '/icons/clementplane-icon-512.png', sizes: '512x512' }),
    ]));
  });

  it('references PWA icon files that exist in public/', () => {
    for (const icon of PWA_OPTIONS.manifest.icons) {
      const iconPath = path.join(process.cwd(), 'public', icon.src.replace(/^\//, ''));
      expect(fs.existsSync(iconPath), icon.src).toBe(true);
    }
  });

  it('uses prompt-based updates and does not runtime-cache Supabase APIs', () => {
    expect(PWA_OPTIONS.registerType).toBe('prompt');
    const runtimeCaching = PWA_OPTIONS.workbox?.runtimeCaching || [];
    expect(JSON.stringify(runtimeCaching)).not.toMatch(/supabase/i);
  });
});
