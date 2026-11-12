#!/usr/bin/env bash
# Check (default) or apply required-`ci` branch protection on dev-v2 and main.
# Usage: [BRANCHES="dev-v2 main"] scripts/ci-branch-protection.sh [check|apply]
# BRANCHES (space separated) defaults to "dev-v2 main"; both are protected by decision.
# Needs: gh (signed in) and jq.
# `apply` changes repo settings and needs repo admin rights. WARNING: PUT .../protection
# REPLACES the whole rule. Settings not in the payload (linear history, conversation
# resolution, lock branch, ...) are reset. `apply` therefore prints the current rule and
# asks for confirmation per branch (set CONFIRM=yes to skip the prompt).
# Exit codes: 0 compliant, 1 not compliant, 2 usage or tool/API error.
set -euo pipefail
mode="${1:-check}"
case "$mode" in check | apply) ;; *) echo "usage: $0 [check|apply]" >&2; exit 2 ;; esac
command -v jq >/dev/null || { echo "error: jq is required" >&2; exit 2; }
command -v gh >/dev/null || { echo "error: gh is required" >&2; exit 2; }
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)" || { echo "error: gh cannot read the repo (signed in?)" >&2; exit 2; }
rc=0
fetch() { # prints JSON; empty output and status 0 when the branch is unprotected (404)
  local out
  if out="$(gh api "repos/$repo/branches/$1/protection" 2>&1)"; then printf '%s' "$out"
  elif printf '%s' "$out" | grep -q 'Branch not protected'; then printf ''
  else echo "error: API call failed for $1: $out" >&2; exit 2; fi
}
set -f # no glob expansion of BRANCHES
branches="${BRANCHES-dev-v2 main}"
for b in $branches; do
  [[ "$b" =~ ^[A-Za-z0-9._/-]+$ && "$b" != -* && "$b" != /* && "$b" != *..* && "$b" != */ && "$b" != *//* && "$b" != *.lock && "$b" != *. ]] || { echo "error: invalid branch name in BRANCHES: $b" >&2; exit 2; }
done
branches="$(printf '%s\n' $branches | sort -u | tr '\n' ' ')"
branches="${branches% }"
[ -n "$branches" ] || { echo "error: BRANCHES is empty" >&2; exit 2; }
if [ "$branches" != "dev-v2 main" ]; then echo "NOTE only processing ($mode): $branches (default is dev-v2 main); exit 0 is not full compliance"; fi
for branch in $branches; do
  if [ "$mode" = apply ]; then
    cur="$(fetch "$branch")"
    echo "Current rule on $branch (will be REPLACED):"
    if [ -n "$cur" ]; then printf '%s' "$cur" | jq .; else echo "(none)"; fi
    if [ "${CONFIRM:-}" != yes ]; then
      a=n; read -r -p "Apply to $branch? [y/N] " a || a=n
      [ "$a" = y ] || { echo "skipped $branch"; continue; }
    fi
    gh api -X PUT "repos/$repo/branches/$branch/protection" --input - >/dev/null <<JSON || { echo "error: PUT failed for $branch" >&2; exit 2; }
{"required_status_checks":{"strict":true,"checks":[{"context":"ci","app_id":15368}]},"enforce_admins":true,
 "required_pull_request_reviews":{"required_approving_review_count":0},"restrictions":null,
 "allow_force_pushes":false,"allow_deletions":false}
JSON
  fi
  out="$(fetch "$branch")"
  ok=false
  [ -n "$out" ] && ok="$(printf '%s' "$out" | jq -r -f "$here/branch-protection.jq")"
  if [ "$ok" = true ]; then echo "OK   $branch"; else echo "FAIL $branch (needs ci required, strict, PR required, admins enforced, no force push or deletion)"; rc=1; fi
done
# Squash-only merging is a repo setting, not part of branch protection; `apply` does not change
# it but verifies it, so exit 0 from either mode means full compliance
# only when BRANCHES is left at its default.
{
  ms="$(gh api "repos/$repo" -q '[.allow_squash_merge,.allow_merge_commit,.allow_rebase_merge]|@json')" || { echo "error: cannot read repo merge settings" >&2; exit 2; }
  if [ "$ms" = '[true,false,false]' ]; then echo "OK   squash-only merge"; else echo "FAIL squash-only merge (set allow_merge_commit and allow_rebase_merge off in repo settings)"; rc=1; fi
}
exit $rc
