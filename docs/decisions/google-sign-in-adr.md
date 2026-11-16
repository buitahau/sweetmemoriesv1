# Open questions: google-sign-in ADRs

ADRs: [0007 database access](../adr/0007-database-access-and-migrations.md), [0008 session cookie scope](../adr/0008-login-session-cookie-scope-and-app-origin.md), [0009 e2e signed-in state](../adr/0009-e2e-signed-in-state-without-real-google.md)

## Topic: ADR 0007: Database access and migrations

### Which data layer should the first database feature use for Better Auth and future tables? (Q-db)

Options:
- Drizzle ORM + @neondatabase/serverless + drizzle-kit migrations
- Kysely + Neon dialect with Better Auth CLI migrations
- Raw SQL with a hand-written adapter

Recommended answer: Drizzle ORM + @neondatabase/serverless: Better Auth has a first-party adapter, it runs on Workers, and the committed migrations will serve Memory and Template tables too.

Answer:

### How should migrations reach the dev Neon branch? (Q-migrate)

Options:
- Automatic migrate step in deploy-dev before the Worker deploy
- A maintainer runs pnpm db:migrate manually before merging

Recommended answer: Automatic step in deploy-dev: the schema can never lag behind the deployed code. It needs DATABASE_URL as a masked GitHub environment secret.

Answer:

## Topic: ADR 0008: Session cookie scope and app origin

### Where should the signed-in app live, and how is the login cookie scoped? (Q-cookie)

Options:
- Main domain (sweetmemories.com/sign-in, /dashboard) with host-only cookies
- Separate app.sweetmemories.com subdomain with host-only cookies
- Cookie on .sweetmemories.com shared with subdomains

Recommended answer: Main domain with host-only cookies: browsers never send them to user subdomains, so rule 1 holds without new infrastructure. The shared-domain option breaks rule 1.

Answer:

## Topic: ADR 0009: E2E signed-in state

### How should e2e tests reach a signed-in state without a real Google account? (Q-e2e)

Options:
- Seed a User and Session in the local test database and set the signed cookie
- Run a mock OAuth/OIDC server and point the Google provider at it in tests
- Add a test-only sign-in endpoint behind an env flag

Recommended answer: Seed the session in the local test database: no app code changes and no backdoor endpoint. The real Google round-trip stays a manual check on dev.

Answer:
