# Open questions: project-skeleton

Feature spec: [project-skeleton](../features/project-skeleton.md)

## Topic: project-skeleton

### What path should the health check use?

Options:
- /api/health
- /healthz
- /api/healthz

Recommended answer: /api/health: keeps all API routes under /api and is self-explanatory.

Answer: /api/health

### Should the health check stay liveness-only, or also report database connectivity once Neon is added?

Options:
- Liveness only (always `{"status":"ok"}` when the server is up)
- Add a DB check later as a separate readiness endpoint
- Add a DB check later to the same endpoint

Recommended answer: Liveness only now, with a separate readiness endpoint later if needed: no database exists in the skeleton, and keeping liveness simple avoids restart loops when the DB has a hiccup.

Answer: Liveness only now, with a separate readiness endpoint later if needed

### Should shadcn/ui be initialised in the skeleton (config only, no components), or added with the first feature that needs a component?

Options:
- Initialise now (config only)
- Add later with the first feature that needs it

Recommended answer: Initialise now: it is part of the stated stack and avoids re-touching the scaffold config later.

Answer: Initialise now (config only)