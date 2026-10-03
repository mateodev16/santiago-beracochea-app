// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3001'

export default defineConfig({
  integrations: [react()],
  // `npm run dev` also runs the Express API with --watch. Keep Astro from
  // watching server-side files so editing the API doesn't reload the browser
  // page, and keep our CLI scripts out of the client graph entirely.
  server: {
    watch: {
      ignored: ['**/server/**', '**/scripts/**', '**/dist/**', '**/.env*'],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // Sin este handler http-proxy responde 500 con un cuerpo vacío y el
          // cliente no puede distinguir "la API está caída" de un error interno.
          configure(proxy) {
            proxy.on('error', (error, _req, res) => {
              if (!res || res.headersSent) return
              res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
              res.end(
                JSON.stringify({
                  error: 'API no disponible',
                  message: `No se pudo contactar la API en ${apiTarget} (${error.code ?? error.message})`,
                }),
              )
            })
          },
        },
      },
    },
  },
})