#!/usr/bin/env bash
set -euo pipefail

# Smoke test of the deployed dev API and web. No arguments.
# Env: DEV_API_URL, DEV_WEB_URL (required).

if [ -z "${DEV_API_URL:-}" ] || [ -z "${DEV_WEB_URL:-}" ]; then
  echo "DEV_API_URL and DEV_WEB_URL must be set" >&2
  exit 2
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# fetch <url>: sets STATUS, and writes $tmp/body and $tmp/headers. Returns 1 on request failure.
fetch() {
  STATUS=$(curl -sS --max-time 10 -H "Cookie: session=fake-value" \
    -o "$tmp/body" -D "$tmp/headers" -w '%{http_code}' "$1" 2>/dev/null) || return 1
}

# commit_of <file>: prints .commit if 40-hex, else "none".
commit_of() {
  node -e '
    let c = "none";
    try {
      const v = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).commit;
      if (typeof v === "string" && /^[0-9a-f]{40}$/.test(v)) c = v;
    } catch {}
    console.log(c);
  ' "$1"
}

failed=0
pass() { echo "PASS $1"; }
fail() { echo "FAIL $1: $2"; failed=1; }
has_cookie() { grep -qi '^set-cookie:' "$tmp/headers"; }

# 1 api health
name="api health"
if ! fetch "$DEV_API_URL/api/health"; then fail "$name" "request failed"
elif [ "$STATUS" != "200" ]; then fail "$name" "status $STATUS"
elif [ "$(cat "$tmp/body")" != '{"status":"ok"}' ]; then fail "$name" "unexpected body"
elif has_cookie; then fail "$name" "set-cookie present"
else pass "$name"; fi

# 2 api version
name="api version"
api_commit="none"
if ! fetch "$DEV_API_URL/api/version"; then fail "$name" "request failed"
elif [ "$STATUS" != "200" ]; then fail "$name" "status $STATUS"
elif [ "$(commit_of "$tmp/body")" = "none" ]; then fail "$name" "unexpected body"
elif has_cookie; then fail "$name" "set-cookie present"
else api_commit=$(commit_of "$tmp/body"); pass "$name"; fi

# 3 web home
name="web home"
if ! fetch "$DEV_WEB_URL/"; then fail "$name" "request failed"
elif [ "$STATUS" != "200" ]; then fail "$name" "status $STATUS"
elif ! grep -qF '<title>SweetMemories</title>' "$tmp/body" || ! grep -qF '<div id="root">' "$tmp/body"; then fail "$name" "unexpected body"
elif has_cookie; then fail "$name" "set-cookie present"
elif ! grep -qi '^x-robots-tag:.*noindex' "$tmp/headers"; then fail "$name" "missing noindex"
else pass "$name"; fi

# 4 web version
name="web version"
if ! fetch "$DEV_WEB_URL/version.json"; then fail "$name" "request failed"
elif [ "$STATUS" != "200" ]; then fail "$name" "status $STATUS"
elif [ "$(commit_of "$tmp/body")" = "none" ]; then fail "$name" "unexpected body"
elif has_cookie; then fail "$name" "set-cookie present"
elif [ "$(commit_of "$tmp/body")" != "$api_commit" ]; then fail "$name" "commit mismatch"
else pass "$name"; fi

exit "$failed"
