import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const vercelConfigPath = path.join(process.cwd(), 'vercel.json');

describe('Vercel static asset routing', () => {
  it('serves existing tutorial PDFs before the SPA fallback', () => {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    expect(config.routes.filter(route => !route.continue)).toEqual([
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/index.html' },
    ]);
    const callback = config.routes.find(route => route.src === '/google-calendar-callback.html');
    expect(callback?.continue).toBe(true);
    expect(callback?.headers['Cache-Control']).toBe('no-store');
    expect(callback?.headers['Referrer-Policy']).toBe('no-referrer');
  });
});
