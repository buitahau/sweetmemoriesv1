// Worker environment typings. DATABASE_URL is a Worker secret in dev (set with
// `wrangler secret put DATABASE_URL --env dev`) and a `.env` value locally.
// Declared here so the first database feature can read it; nothing reads it yet.
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string
  }
}
