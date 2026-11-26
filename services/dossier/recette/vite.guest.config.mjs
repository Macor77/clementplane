import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build only the invitation page and its assets on the dedicated test origin.
export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    {
      name: 'dossier-guest-logo',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'brand/clementplane-logo-light.svg',
          source: readFileSync(new URL('../../../public/brand/clementplane-logo-light.svg', import.meta.url)),
        });
      },
    },
  ],
  build: { rollupOptions: { input: 'dossier-invite.html' } },
});
