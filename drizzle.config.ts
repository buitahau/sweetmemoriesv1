import { defineConfig } from 'drizzle-kit'

// drizzle-kit does not read .env itself; load it when present (CI passes the env var).
try {
  process.loadEnvFile('.env')
} catch {
  // no .env file: rely on the process environment
}

// Schema lives under src/server/db/ (added with the first tables); SQL
// migrations are committed under drizzle/ (ADR 0007).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
