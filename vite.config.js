import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [VitePWA({
    registerType: 'prompt',
    injectRegister: false,
    manifest: {
      id: '/',
      name: 'Gatime — Your recipe book',
      short_name: 'Gatime',
      description: 'Your personal recipe book with ingredients, instructions, and nutrition.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#faf9f6',
      theme_color: '#315c45',
      lang: 'en',
      categories: ['food', 'lifestyle'],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      globIgnores: ['**/play-store/**'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/play-store\//, /^\/android-test\.html$/, /^\/downloads\//, /^\/privacy\.html$/, /^\/delete-account\.html$/, /^\/api\//, /^\/\.well-known\//],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },
  })],
});
