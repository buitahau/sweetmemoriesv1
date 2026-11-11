# 02 Health check API route

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** 01
**Feature spec:** [project-skeleton](../../features/project-skeleton.md)
**Mockup:** none

## What to change

Add a server route at `/api/health` that handles `GET` only and returns `{"status":"ok"}` as JSON with `Cache-Control: no-store` and no cookies. Other methods get `405`. Keep the body free of environment and version data. Document the endpoint in `docs/api/health.md` (purpose, auth: none, input: none, output, errors: 405).

## Checklist

- [ ] `GET /api/health` handler
- [ ] 405 for other methods
- [ ] Vitest unit test for the handler
- [ ] `docs/api/health.md`

## Verification

- [ ] Unit test: GET returns 200, JSON content type, exact body `{"status":"ok"}`, `Cache-Control` containing `no-store`, no `Set-Cookie`; POST returns 405.
- [ ] Manual: `curl -i http://localhost:<port>/api/health` shows the above; `curl -i -X POST ...` shows 405.
- [ ] `docs/api/health.md` exists and matches the behavior.
- [ ] Covers US-skeleton-1 scenarios 1 to 6.
