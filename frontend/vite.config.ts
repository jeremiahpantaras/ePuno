import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Serve index.html for all unmatched routes (SPA fallback)
    {
      name: 'spa-history-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url ?? '/'
          if (!url.includes('.') && url !== '/') req.url = '/'
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url ?? '/'
          if (!url.includes('.') && url !== '/') req.url = '/'
          next()
        })
      },
    },
  ],
})
