import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['sounds/*.mp3', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Garden Almanac',
        short_name: 'Almanac',
        description: 'Personal gardening almanac — planting calendar, frost dates, journal, and moon planting',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#16a34a',
        icons: [
          {
            src: '/icons/seedling.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}']
      }
    })
  ]
})
