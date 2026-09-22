import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const vercelConfigPath = path.join(process.cwd(), 'vercel.json');

describe('Vercel static asset routing', () => {
  it('serves existing tutorial PDFs before the SPA fallback', () => {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    expect(config.routes).toEqual([
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/index.html' },
    ]);
  });
});
