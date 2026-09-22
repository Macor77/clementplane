import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const cssPath = path.join(process.cwd(), 'src/components/tutorials/TutorialLibrary.css');

describe('tutorial carousel touch targets', () => {
  it('keeps each progress control at least 44 by 44 pixels', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    const dotRule = css.match(/\.tutorial-carousel__dot\s*\{([^}]+)\}/)?.[1] || '';

    expect(dotRule).toMatch(/width:\s*44px/);
    expect(dotRule).toMatch(/height:\s*44px/);
  });
});
