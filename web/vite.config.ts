import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // so the server (Hono, same box) can proxy /api during local dev once it exists
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
