import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vitest/config'

// The Worker preset is build-only: under `pnpm dev` it leaves SSR output stale
// after edits, so dev uses the default Nitro dev server.
export default defineConfig(({ command }) => ({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart(),
    nitro(command === 'build' ? { preset: 'cloudflare-module' } : {}),
    viteReact(),
    tailwindcss(),
  ],
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
}))
