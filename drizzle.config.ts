import { defineConfig } from 'drizzle-kit'

// drizzle-kit does not read .env itself; load it when present (CI passes the env var).
try {
  process.loadEnvFile('.env')
} catch {
  // no .env file: rely on the process environment
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and set it.')
}

// Schema lives under src/server/db/ (added with the first tables); SQL
// migrations are committed under drizzle/ (ADR 0007).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: databaseUrl },
})
