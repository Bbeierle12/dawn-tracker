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
      includeAssets: ['sounds/*.mp3', 'icons/*.png'],
      manifest: {
        name: 'Butt Crack of Dawn',
        short_name: 'BCOD',
        description: 'Rise with the actual crack of dawn - Bakersfield edition',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a0a2e',
        theme_color: '#ff6b35',
        icons: [
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
