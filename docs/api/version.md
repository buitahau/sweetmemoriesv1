# Version API

Status: proposed ([ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)). Implemented by [add-version-endpoint](../tasks/dev-deploy-verification/add-version-endpoint.md).

## Purpose

Tells an agent or a deploy script which git commit the running API was built from, so it can wait until a merge is live on dev before testing. Separate from [health](health.md), whose response shape is fixed.

## Auth

None. Public. Never reads or sets cookies.

## Endpoints

### `GET /api/version`

- Request: no body; any query string is ignored.
- Response `200`:
  - Header `Content-Type: application/json; charset=utf-8`
  - Header `Cache-Control: no-store`
  - No `Set-Cookie`, no `X-Powered-By`
  - Body: `{"commit":"<value>"}` where `<value>` is `process.env.GIT_SHA` if it matches `^[0-9a-f]{40}$`, otherwise exactly `unknown`.
- `HEAD /api/version`: `200`, same headers, empty body.
- `/api/version/` (trailing slash): same as above.
- Wrong method (e.g. `POST`): `404 {"error":"not_found"}` (whole-API rule in [health.md](health.md#errors-whole-api)).

## Notes

- `GIT_SHA` is set only at deploy time (`--var GIT_SHA:$GITHUB_SHA`); locally the body is `{"commit":"unknown"}`.
- The value is validated so a malformed variable never reaches the response.
- The commit SHA is public by design on dev ([Q005](../questions/questions-2026-11-09-requirement-breakdown.md)); it is not user data.
