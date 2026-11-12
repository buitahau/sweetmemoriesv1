// Worker environment typings (process.env). DATABASE_URL is a Worker secret in dev (set with
// `wrangler secret put DATABASE_URL --env dev`) and a `.env` value locally.
// Read the binding through `process.env` (nodejs_compat); do not add a second
// declaration via `cloudflare:workers` env or a generated Env.
// Declared here so the first database feature can read it; nothing reads it yet.
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string
  }
}
