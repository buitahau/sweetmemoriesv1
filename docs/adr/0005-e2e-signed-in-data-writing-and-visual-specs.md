# 0005: E2E specs for signed-in, data-writing and visual cases

- Status: proposed (waits for the product owner; amends [ADR 0004](0004-playwright-e2e-specs.md) once accepted).
- Date: 2026-11-10

## Context

- [ADR 0004](0004-playwright-e2e-specs.md) automates only FE cases that need no sign-in, write no data and are not mockup comparisons. Everything else is `Spec: prose` and run by hand, or Blocked.
- The product owner wants those cases automated to cut manual work.
- Blockers named in ADR 0004: no test-only sign-in (Google sign-in and 2FA cannot be scripted), no dev database with seed and reset, domain design not approved (`CLAUDE.md`), and [ADR 0003](0003-frontend-styling-and-self-hosted-fonts.md) rejects screenshot-diff tools.
- Security rules in `CLAUDE.md` still hold: public memory pages stay cookie-less on a separate origin; no private data in page output.
- The `business-analyst` and `tester` agents already describe the new case fields (`Auth`, `Data`, `Visual`) and are written to fall back to prose until this ADR is accepted.

## Decision

| Concern | Choice |
|---|---|
| Eligibility | Every FE case gets `Spec: <path>`, including signed-in, data-writing and mockup-fidelity cases, once the infrastructure below exists. `Spec: prose` remains only for subjective judgement and for cases whose infrastructure is missing. |
| BE tickets | Replaces ADR 0004's "BE tickets keep their `curl` suites". BE cases keep their `curl` and Expected result in the ticket and also get `Spec: <path>`, `Auth` and `Data`. The tester authors them as Playwright API tests (`request` fixture) in `e2e/specs/<feature-slug>/<feature-or-task-slug>.api.spec.ts`, sharing the FE runner, sessions, seed/reset and `<ticket-slug> E2E-n` titles. Infra checks that cannot run over HTTP stay `Spec: prose`. |
| Case fields | `Auth: none\|user\|admin`, `Data: none\|seed:<fixture>\|creates`, `Visual: <measured values>\|none`, next to `Spec:` and `Testids:`. |
| Test sign-in | A test-only session endpoint in the API, enabled only when `E2E_AUTH_SECRET` is set (dev environment only; absent from production builds and config). It creates or finds a fixed test User or admin and returns a Better Auth session cookie. Playwright global setup calls it once per role and writes `e2e/.auth/<role>.json` (git-ignored). Specs load it with `storageState`. The manual `auth:save` flow of ADR 0004 stays as a fallback. Never reaches the public-page origin. |
| Seed and reset | A token-guarded dev-only endpoint (same guard as above) that resets test data and loads named fixtures, against the dev Neon database or a Neon branch, never production or a shared database. `Data: creates` specs also use run-unique prefixes (slug, names) and clean up their own data, so two runs in a row pass. |
| Visual fidelity | Measured assertions, not pixel diffs: `toHaveCSS`, bounding boxes and fixed viewports (390 and 1280 wide), with values copied from the mockup into the case's `Visual:` field. No screenshot-diff tool; [ADR 0003](0003-frontend-styling-and-self-hosted-fonts.md) is unchanged. Subjective mockup checks stay prose with screenshots. |
| Baselines | None. If `toHaveScreenshot` is wanted later it needs its own ADR; agents never run `--update-snapshots`. |
| Agents | `business-analyst` writes the new fields; `business-analyst-review` and the `requirement-breakdown` workflow check them; `tester` authors and runs the specs; neither reads or prints session files; the implementer still only adds listed `data-testid` values. `implement-and-test-ticket` authors FE and BE specs before implementation and runs them against `BASE_URL` (web) and `API_URL` (API). While this ADR is proposed, the `tester` and the skill treat signed-in, data-writing and visual cases as prose or Blocked. |
| Sessions | One saved session per role (`e2e/.auth/<role>.json`), opted into per spec with `sessionFile(role)` from `e2e/support/session.ts`. No global `STORAGE_STATE`, so anonymous specs stay signed out. |
| Gating | Domain-dependent specs (Memories, Templates, Blocks, Photos) wait for design approval; this ADR does not approve domain code. The sign-in and seed/reset endpoints themselves are domain-adjacent (auth, database) and are built only after the product owner approves them. |

## Consequences

- Most cases become repeatable specs and manual work shrinks to subjective checks.
- Two test-only endpoints are a new attack surface. Mitigation: secret required, enabled by environment flag only on dev, covered by tests that prove they return 404 when the flag is off, and a deploy check that production does not expose them.
- Specs that write data need discipline (unique data, cleanup); a leaking spec can pollute the dev database.
- Measured visual assertions catch spacing and color drift but not every visual difference.
- Needs follow-up tickets: test sign-in endpoint, seed/reset endpoint, `e2e` global setup and fixtures.
- Unit tests are a separate, always-on rule (not gated by this ADR): every code task has a `unit-tests` section, the implementer writes them, and `implement-ticket` will not open a PR unless `npm test`, `npm run typecheck` and `npm run build` pass.

## Alternatives

| Option | Why not chosen |
|---|---|
| Keep manual sign-in with `auth:save` only | Session expires, needs the user's phone for 2FA; keeps manual work. |
| Automate Google sign-in | Google blocks automated logins; 2FA needs the user's device. |
| Vitest + supertest for BE cases | A second runner and report beside Playwright; BE and FE would not share sign-in or seed/reset. |
| Mock Better Auth in the frontend | Does not test the real session and cookie scope. |
| Playwright snapshot baselines now | Rendering differs across machines; rejected by ADR 0003; revisit in its own ADR. |
| Separate Neon database per test run | Heavier than a reset plus unique data; can be adopted later behind the same reset endpoint. |

## Related

- [ADR 0004](0004-playwright-e2e-specs.md): amended by this ADR once accepted (Eligibility, Deferred and the sign-in note in Consequences).
- [ADR 0003](0003-frontend-styling-and-self-hosted-fonts.md): unchanged.
- [e2e-specs](../features/e2e-specs.md): the `e2e/` project.
