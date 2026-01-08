import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 8080,
    host: "0.0.0.0",
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'MagicTalk Community',
        short_name: 'MagicTalk',
        description: 'Uma comunidade vibrante com temática anime para RPG e conexões.',
        theme_color: '#070210',
        background_color: '#070210',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'https://storage.googleapis.com/gpt-engineer-file-uploads/dPbn5UDBIwfTs3KC0nnQke3sXQm2/uploads/1767287753010-ChatGPT_Image_1_de_jan._de_2026,_14_12_48.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://storage.googleapis.com/gpt-engineer-file-uploads/dPbn5UDBIwfTs3KC0nnQke3sXQm2/uploads/1767287753010-ChatGPT_Image_1_de_jan._de_2026,_14_12_48.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        // Importar o código de push no service worker principal
        importScripts: ['/sw-push-handler.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatars-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": "/",
    },
  },
  define: {
    'process.env': {},
  },
});