import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { PWA_OPTIONS } from './pwa.config.js'

export default defineConfig({
  plugins: [react(), VitePWA(PWA_OPTIONS)],
  base: '/',
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      '.app.github.dev',
    ],
  },
})
