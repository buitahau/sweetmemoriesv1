# Health check

## `GET /api/health`

- **Purpose:** liveness check for deploys and uptime monitors. Does not check Neon or S3.
- **Auth:** none. No cookies are read or set.
- **Input:** none.
- **Output:** `200`, `Content-Type: application/json`, `Cache-Control: no-store`, body exactly `{"status":"ok"}`. The body never contains environment, version or host data.
- **Errors:** any other method (`POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`) returns `405` with `Allow: GET` and an empty body. If the server is down the request fails to connect.

Feature: [project-skeleton](../features/project-skeleton.md) (US-skeleton-1).
