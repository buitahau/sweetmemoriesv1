# 04 E2E suite for homepage-seo

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** 03
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** none

## What to change

`e2e/homepage-seo/` with one test per scenario of US-homepage-seo-1 to US-homepage-seo-5. Scenarios parse raw HTML (no JavaScript), except US-homepage-seo-3.6, which loads `/` in Playwright with JavaScript and compares the live DOM to the raw HTML.

There is no production environment, so production and misconfigured behaviour is checked locally with `.env` overrides under `pnpm dev` (`/` does not depend on auth config). Each run declares what it expects through `E2E_SEO_PROFILE`:

| Profile | Server config | Command |
| --- | --- | --- |
| `dev` (default) | dev values, or local `SITE_URL=http://localhost:3000`, `SITE_INDEXABLE=false` | `pytest e2e/homepage-seo -rs` against `pnpm start`, or with `E2E_BASE_URL=<dev URL>` |
| `prod-like` | `SITE_URL=https://sweetmemories.com SITE_INDEXABLE=true pnpm dev` | `E2E_SEO_PROFILE=prod-like pytest e2e/homepage-seo -rs` |
| `unset-indexable` | `SITE_INDEXABLE` unset | `E2E_SEO_PROFILE=unset-indexable pytest e2e/homepage-seo -rs` |
| `bad-url` | `SITE_URL=not-a-url` | `E2E_SEO_PROFILE=bad-url pytest e2e/homepage-seo -rs` |

## Checklist

- [ ] Profile-specific scenarios skip with a reason when the profile does not match: `prod-like` runs US-2.1, 2.2, 3.1, 3.5 and 5.1; `dev` runs 2.4 and 3.2; `unset-indexable` runs 3.3; `bad-url` runs 3.4; all other scenarios run in every profile and assert against the target's own origin
- [ ] US-homepage-seo-2.5: against dev send only `X-Forwarded-Host` and `Forwarded` (Cloudflare rejects a foreign `Host` before the Worker); locally also send `Host: evil.example`
- [ ] US-homepage-seo-3.6 runs in every profile
- [ ] Document the profiles and commands in `e2e/README.md`

## Verification

- [ ] `pytest e2e/homepage-seo -rs` passes locally in each of the four profiles and against dev (`dev` profile).
- [ ] The skip list of each run matches the table above, and every scenario passes in at least one profile.
- [ ] Each scenario ID appears in a test name.
