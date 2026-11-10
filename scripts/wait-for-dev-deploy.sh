#!/usr/bin/env bash
set -euo pipefail

# Waits until dev API and web report the given commit (or a later dev-v1 commit).
# Usage: wait-for-dev-deploy.sh <40-hex-commit-sha>
# Env: DEV_API_URL, DEV_WEB_URL (required), WAIT_TIMEOUT_SECONDS (default 600).

if [ "$#" -ne 1 ] || ! [[ "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "usage: wait-for-dev-deploy.sh <40-hex-commit-sha>" >&2
  exit 2
fi
target="$1"

if [ -z "${DEV_API_URL:-}" ] || [ -z "${DEV_WEB_URL:-}" ]; then
  echo "DEV_API_URL and DEV_WEB_URL must be set" >&2
  exit 2
fi

timeout_s="${WAIT_TIMEOUT_SECONDS:-600}"
if ! [[ "$timeout_s" =~ ^[1-9][0-9]*$ ]]; then
  echo "WAIT_TIMEOUT_SECONDS must be a positive integer" >&2
  exit 2
fi

read_commit() {
  local out
  out=$(curl -fsS --max-time 10 "$1" 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d));
    process.stdin.on("end", () => {
      let c = "none";
      try {
        const v = JSON.parse(s).commit;
        if (typeof v === "string" && /^[0-9a-f]{40}$/.test(v)) c = v;
      } catch {}
      console.log(c);
    });
  ' 2>/dev/null) || out="none"
  echo "${out:-none}"
}

is_live() {
  local deployed="$1"
  if [ "$deployed" = "$target" ]; then
    return 0
  fi
  if [ "$deployed" = "none" ]; then
    return 1
  fi
  git fetch --quiet origin dev-v1 >/dev/null 2>&1 || true
  git merge-base --is-ancestor "$target" "$deployed" >/dev/null 2>&1
}

start=$SECONDS
while true; do
  api=$(read_commit "$DEV_API_URL/api/version")
  web=$(read_commit "$DEV_WEB_URL/version.json")
  echo "waiting: api=$api web=$web"
  if is_live "$api" && is_live "$web"; then
    echo "deployed: api=$api web=$web"
    exit 0
  fi
  if [ $((SECONDS - start)) -ge "$timeout_s" ]; then
    echo "timeout after ${timeout_s}s: api=$api web=$web target=$target" >&2
    exit 1
  fi
  sleep 10
done
