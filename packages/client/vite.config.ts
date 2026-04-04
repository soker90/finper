/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import * as path from 'path'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version)
  },
  resolve: {
    alias: [
      { find: 'assets', replacement: path.resolve(__dirname, '/src/assets') },
      { find: 'components', replacement: path.resolve(__dirname, '/src/components') },
      { find: 'config', replacement: path.resolve(__dirname, '/src/config') },
      { find: 'constants', replacement: path.resolve(__dirname, '/src/constants') },
      { find: 'contexts', replacement: path.resolve(__dirname, '/src/contexts') },
      { find: 'guards', replacement: path.resolve(__dirname, '/src/guards') },
      { find: 'hooks', replacement: path.resolve(__dirname, '/src/hooks') },
      { find: 'services', replacement: path.resolve(__dirname, '/src/services') },
      { find: 'types', replacement: path.resolve(__dirname, '/src/types') },
      { find: 'themes', replacement: path.resolve(__dirname, '/src/themes') },
      { find: 'utils', replacement: path.resolve(__dirname, '/src/utils') }
    ]
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Finper',
        short_name: 'Finper',
        description: 'Personal finance management app',
        theme_color: '#1677ff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['json', 'html'],
      exclude: ['node_modules/']
    }
  }
})
