# Input: GET /branches/<b>/protection JSON. Output: true when protection meets the ci-pr-checks rules.
# Requires: only `ci` (from GitHub Actions, app 15368) as required check, strict, a required PR,
# admins enforced, no force pushes, no deletions.
(.required_status_checks // {}) as $rsc
| [
    ($rsc.strict == true),
    ((($rsc.checks // []) | map(.context + ":" + (.app_id|tostring))) == ["ci:15368"]),
    (.required_pull_request_reviews != null),
    (.enforce_admins.enabled == true),
    ((.allow_force_pushes.enabled // false) | not),
    ((.allow_deletions.enabled // false) | not)
  ]
| all
