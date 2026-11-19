import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

/**
 * Builds a database client for the current request.
 *
 * Reads `process.env.DATABASE_URL` on every call: on Workers there is no
 * module-level connection, and the binding is only available at request time
 * (ADR 0007). Never log or echo the connection string.
 */
/** True when a database connection string is configured (never exposes the value). */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Set it in .env locally or as a Worker secret.',
    )
  }
  return drizzle(neon(url))
}

export type Db = ReturnType<typeof getDb>
