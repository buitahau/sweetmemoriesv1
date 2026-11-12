#!/usr/bin/env bash
# Check (default) or apply required-`ci` branch protection on dev-v2 and main.
# Usage: scripts/ci-branch-protection.sh [check|apply]
# `apply` changes repo settings and needs repo admin rights.
set -euo pipefail
mode="${1:-check}"
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
rc=0
for branch in dev-v2 main; do
  if [ "$mode" = apply ]; then
    gh api -X PUT "repos/$repo/branches/$branch/protection" --input - <<JSON >/dev/null
{"required_status_checks":{"strict":true,"contexts":["ci"]},"enforce_admins":true,
 "required_pull_request_reviews":null,"restrictions":null,
 "allow_force_pushes":false,"allow_deletions":false}
JSON
  fi
  out="$(gh api "repos/$repo/branches/$branch/protection" 2>/dev/null || true)"
  ok="$(printf '%s' "$out" | jq -r '[.required_status_checks.strict, ((.required_status_checks.contexts // [])|index("ci")!=null), .enforce_admins.enabled, (.allow_force_pushes.enabled|not)]|all' 2>/dev/null || echo false)"
  if [ "$ok" = true ]; then echo "OK   $branch"; else echo "FAIL $branch (needs ci required, strict, admins enforced, no force push)"; rc=1; fi
done
exit $rc
