# 02 Health check API route

**Status:** done
**Side:** backend
**Size:** S
**Dependencies:** 01
**Feature spec:** [project-skeleton](../../features/project-skeleton.md)
**Mockup:** none

## What to change

Add a server route at `/api/health` that handles `GET` only and returns `{"status":"ok"}` as JSON with `Cache-Control: no-store` and no cookies. Other methods get `405`. Keep the body free of environment and version data. Document the endpoint in `docs/api/health.md` (purpose, auth: none, input: none, output, errors: 405).

## Checklist

- [x] `GET /api/health` handler
- [x] 405 for other methods
- [x] Vitest unit test for the handler
- [x] `docs/api/health.md`

## Verification

- [x] Unit test: GET returns 200, JSON content type, exact body `{"status":"ok"}`, `Cache-Control` containing `no-store`, no `Set-Cookie`; POST returns 405.
- [x] Manual: `curl -i http://localhost:<port>/api/health` shows the above; `curl -i -X POST ...` shows 405.
- [x] `docs/api/health.md` exists and matches the behavior.
- [x] Covers US-skeleton-1 scenarios 1 to 6.
