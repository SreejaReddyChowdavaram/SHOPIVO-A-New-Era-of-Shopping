import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Vite 8 compatible way to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
//
// KEY DECISIONS:
//   1. tailwindcss() plugin — Tailwind v4 uses a Vite plugin, not a config file.
//      Tailwind is activated with `@import "tailwindcss"` in index.css.
//
//   2. resolve.alias → `@` maps to `src/` directory.
//      Write: import Button from '@/components/common/Button'
//      Instead of: import Button from '../../components/common/Button'
//      Much cleaner as the project grows in depth.
//
//   3. server.port 5173 — matches VITE_API_BASE_URL in CORS config.

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/uploads': {
        target: 'http://localhost:8080/api',
        changeOrigin: true,
      },
    },
  },
})
