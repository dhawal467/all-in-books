import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'All in Books',
        short_name: 'AllInBooks',
        description: 'Personal accounting for Android',
        theme_color: '#1B3A5C',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/tesseract*'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/www\.googleapis\.com/,
          handler: 'NetworkFirst',
          options: { networkTimeoutSeconds: 10 }
        }]
      }
    })
  ]
});
