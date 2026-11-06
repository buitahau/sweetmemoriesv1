# Health API

Status: proposed ([ADR 0001](../adr/0001-monorepo-skeleton-and-tooling.md)). Implemented by [add-health-endpoint](../tasks/api-skeleton/add-health-endpoint.md).

## Purpose

Liveness check: tells a developer, a load balancer or a deploy script that the API process is up and answering HTTP. It does not check Neon, S3 or auth (see [Q004](../questions/questions-2026-11-08-requirement-breakdown.md)).

## Auth

None. Public. Never reads or sets cookies.

## Endpoints

### `GET /api/health`

- Request: no body, no query parameters (any query string is ignored).
- Response `200`:
  - Header `Content-Type: application/json; charset=utf-8`
  - Header `Cache-Control: no-store`
  - No `Set-Cookie` header, no `X-Powered-By` header
  - Body, exactly: `{"status":"ok"}`
- `HEAD /api/health`: `200`, same headers, empty body (Express default for GET routes).
- `/api/health/` (trailing slash): `200`, same as above (Express non-strict routing).

### Errors (whole API)

| Case | Status | Body |
|---|---|---|
| Unknown path, e.g. `GET /api/nope` | 404 | `{"error":"not_found"}` |
| Wrong method on a known path, e.g. `POST /api/health` | 404 | `{"error":"not_found"}` |
| Unexpected server error | 500 | `{"error":"internal_error"}` (no stack trace in the body) |

## Notes

- Wrong method returns 404 (not 405) in the skeleton to keep one catch-all handler; revisit when real endpoints exist.
- Response shape is fixed; adding fields (version, uptime) needs a doc change first.
