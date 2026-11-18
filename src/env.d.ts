// Worker environment typings (process.env). Secrets are Worker secrets in dev (pushed by
// `deploy-dev` from the GitHub Environment `dev`) and `.env` values locally.
// Read the binding through `process.env` (nodejs_compat); do not add a second
// declaration via `cloudflare:workers` env or a generated Env.
// Declared here so the database and auth features can read them; nothing reads them yet.
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string
    GOOGLE_CLIENT_ID?: string
    GOOGLE_CLIENT_SECRET?: string
    BETTER_AUTH_SECRET?: string
    BETTER_AUTH_URL?: string
  }
}
