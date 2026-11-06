# Questions: requirement-breakdown

Session 2026-11-08. Requirement: "Initialize project including backend and frontend. Only generate the skeleton: with BE, a health check API. With FE, a simple home page showing the text 'SweetMemories home page'."

## Q001: Does this requirement approve writing skeleton code during the design phase?

- Feature: project-workspace
- Status: open
- Asked: 2026-11-08
- Blocks: every task (implementation must not start until answered); `implement-ticket` step 2 stops while `CLAUDE.md` says the design is not approved

**Question**: `CLAUDE.md` "Project state" says: "Do not write or restore backend/application code until the user approves the design." This requirement asks for backend and frontend skeleton code. Does it count as approval for the skeleton only (no domain code)? If yes, `CLAUDE.md` "Project state" and "Commands" must be updated, and agents may not edit `CLAUDE.md` on their own.

**Options**
1. A: Yes, skeleton only. A human updates `CLAUDE.md` "Project state" to "Skeleton approved (ADR 0001); domain code still waits for design approval" and fills "Commands" from `docs/infra/local-development.md`. (recommended)
2. B: No, wait for full design approval; keep the docs as the plan.

**Default if unanswered**: Do not start implementation. Docs stay at Status `not-started`.

**Answer**: _(human fills in)_

---

## Q002: Confirm the tooling choices in ADR 0001

- Feature: project-workspace
- Status: open
- Asked: 2026-11-08
- Blocks: nothing, using default below (ADR 0001 stays `proposed` until confirmed)

**Question**: The stack names only "React" and "Node". ADR 0001 picks: one repo with npm workspaces (`apps/api`, `apps/web`), TypeScript, Node 24 (Maintenance LTS; version choice asked separately in Q008), Express 5, Vite, Vitest, no linting yet. These shape every later task. Do you accept them?

**Options**
1. A: Accept ADR 0001 as written. (recommended: smallest toolset, junior-friendly, Express 5 works with Better Auth)
2. B: Accept with changes (say which: e.g. pnpm, Fastify, Node 26, plain JavaScript, add ESLint now).
3. C: Two separate repositories.

**Default if unanswered**: Option A; ADR 0001 status changes to `accepted` when Q001 is answered "yes".

**Answer**: _(human fills in)_

---

## Q003: Where is the parked backend draft, and should the skeleton reuse it?

- Feature: api-skeleton
- Status: open
- Asked: 2026-11-08
- Blocks: nothing, using default below

**Question**: `CLAUDE.md` says a parked backend draft exists and must stay untouched, but no draft is in the tracked tree. The new API goes to `apps/api`. Should anything from the draft be reused, and could its location collide with `apps/`?

**Options**
1. A: Ignore the draft; build `apps/api` fresh; never move or edit the draft. (recommended)
2. B: Port parts of the draft into `apps/api` (needs a separate review of the draft first).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q004: Should the health check test the database (readiness) or only that the API is up (liveness)?

- Feature: api-skeleton
- Status: open
- Asked: 2026-11-08
- Blocks: nothing, using default below

**Question**: "A health check API" can mean liveness (process answers) or readiness (Neon reachable, S3 reachable). The skeleton has no database yet. Deploy platforms often use the endpoint to decide if traffic is sent, so a DB check there can take the API offline when Neon is slow.

**Options**
1. A: Liveness only now: `GET /api/health` -> `{"status":"ok"}`. Add a separate readiness endpoint when Neon is connected. (recommended)
2. B: Include a version/commit field now (helps confirm deploys in `implement-ticket` step 6).
3. C: Check Neon now (requires a Neon project and secrets, out of skeleton scope).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q005: Are CI and a dev deployment part of "initialize project"?

- Feature: project-workspace
- Status: open
- Asked: 2026-11-08
- Blocks: nothing, using default below (tests run locally)

**Question**: The `implement-ticket` flow merges into `dev-v1`, waits for CI and deploy, then tests on a dev environment URL. No CI, hosting or dev URL exists. Without them, tickets can only be tested locally.

**Options**
1. A: Out of scope now; test locally (`http://localhost:3000`, `http://localhost:5173`). Raise CI + dev hosting as the next requirement, with its own ADR (hosting choice, subdomains, separate cookie-less origin for Memory pages). (recommended)
2. B: Add a CI workflow (install, typecheck, test, build) to this requirement, no deploy.
3. C: Add CI and a dev deploy now (needs a hosting decision).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q006: Which "home page" is this?

- Feature: web-skeleton
- Status: open
- Asked: 2026-11-08
- Blocks: nothing, using default below

**Question**: `README.md` has two kinds of home page: the public product Homepage (`sweetmemories.com`) and a User's home page (`john.sweetmemories.com`). The skeleton page shows only "SweetMemories home page". Which one does it stand for, and is the text final or a placeholder?

**Options**
1. A: Placeholder for the product Homepage at the app root; replaced when the mockup Homepage is built. (recommended)
2. B: It is meant as the User subdomain home (would need subdomain routing, out of skeleton scope).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q007: Which branch is the integration base for diff checks?

- Feature: project-workspace
- Status: open
- Asked: 2026-11-08
- Blocks: nothing, using default below

**Question**: Several checks say "only these files changed" (create-root-workspace item 7, document-commands items 6-7, project-workspace item 9). They need a base branch. The `implement-ticket` flow mentions `dev-v1` (see Q005), but no such branch is defined in the docs; the repository has `main` (default) and `mainv1`. All checks now use `$BASE_BRANCH`, set in one place: `docs/infra/local-development.md` "Base branch". Update after review (F03): checks use the merge-base form `git diff "$BASE_BRANCH"...HEAD`, so later commits on the base branch no longer show up. But the design docs exist today only on `mainv1` (uncommitted). If the base is `origin/main` and they are not merged there first, every design doc appears as "changed" in the diff checks.

**Options**
1. A: `origin/main`, and merge the design docs into `main` before the first implementation branch is created; switch to a dev integration branch later by editing the one section in `local-development.md`. (recommended)
2. B: `origin/dev-v1` now (the branch must be created first, from a commit that contains the design docs).
3. C: `origin/mainv1` (works once the design docs are committed and pushed on `mainv1`).

**Default if unanswered**: Option A (`BASE_BRANCH=origin/main`; design docs merged into `main` first).

**Answer**: _(human fills in)_

---

## Q008: Node 24 (Maintenance LTS) or Node 26 (Active LTS)?

- Feature: project-workspace
- Status: open
- Asked: 2026-11-08
- Blocks: nothing, using default below (ADR 0001 stays `proposed` until Q001/Q002 are answered anyway)

**Question**: ADR 0001 picks Node 24. Facts checked on 2026-11-08 against the Node.js release schedule: Node 24 has been in Maintenance LTS since 2026-10-20 (security fixes only, end of life 2028-04-30). Node 26 has been Active LTS since 2026-10-28 (end of life 2029-04-30). The pinned Vite generator (`create-vite` 9.3.4) still targets Node 24 (`@types/node` ^24). A new project usually starts on the Active LTS. Which line do you want? The choice is cheap now (`.nvmrc`, `engines`, ADR 0001, `docs/infra/local-development.md`, the task docs that say "Node 24") and costly after the first deploy.

**Options**
1. A: Keep Node 24. It matches the generator and gets 17 more months of security fixes. Plan the move to 26 before 2028-04. (recommended for the skeleton, lowest risk)
2. B: Switch to Node 26 now. One more year of support and no near-term upgrade, at a small risk of library or type mismatches with a template built for 24.

**Default if unanswered**: Option A (Node 24).

**Answer**: _(human fills in)_

---
