import { defineConfig } from 'drizzle-kit'

// drizzle-kit does not read .env itself; load it when present (CI passes the env var).
try {
  process.loadEnvFile('.env')
} catch {
  // no .env file: rely on the process environment
}

// DATABASE_MIGRATE_URL (owner role, DDL rights) wins when set: the app role used by the
// Worker is non-owner and cannot create tables (deploy-dev migrates with the owner role).
const databaseUrl = process.env.DATABASE_MIGRATE_URL || process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    'Neither DATABASE_MIGRATE_URL nor DATABASE_URL is set. Copy .env.example to .env and set one.',
  )
}

// Schema lives under src/server/db/schema/; SQL
// migrations are committed under drizzle/ (ADR 0007).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema',
  out: './drizzle',
  dbCredentials: { url: databaseUrl },
})
