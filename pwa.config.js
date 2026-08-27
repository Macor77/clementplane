export const PWA_OPTIONS = {
  registerType: 'prompt',
  includeAssets: [
    'favicon.ico',
    'apple-touch-icon.png',
    'brand/clementplane-symbol.svg',
    'icons/clementplane-icon-192.png',
    'icons/clementplane-icon-512.png',
  ],
  manifest: {
    name: 'Clementplane',
    short_name: 'Clementplane',
    description: 'Planning et gestion des missions entre organismes de formation et formateurs.',
    lang: 'fr-FR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: '#0B132B',
    background_color: '#0B132B',
    icons: [
      { src: '/icons/clementplane-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/clementplane-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/clementplane-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    navigateFallback: '/index.html',
    cleanupOutdatedCaches: true,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [],
  },
};
