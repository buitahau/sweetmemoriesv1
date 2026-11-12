import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart(),
    nitro({ preset: 'cloudflare-module' }),
    viteReact(),
    tailwindcss(),
  ],
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
})
