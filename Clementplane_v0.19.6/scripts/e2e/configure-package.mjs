import fs from 'node:fs';

const file = new URL('../../package.json', import.meta.url);
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  'test:e2e': 'playwright test',
  'test:e2e:headed': 'playwright test --headed',
  'test:e2e:report': 'playwright show-report',
  'e2e:seed': 'node scripts/e2e/reset-and-seed.mjs',
};

pkg.devDependencies = {
  ...pkg.devDependencies,
  '@playwright/test': '^1.55.0',
};

fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
console.log('✅ package.json configuré pour Playwright/E2E');
