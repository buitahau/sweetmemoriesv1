"""E2E checks for google-sign-in task 01 (docs/tasks/google-sign-in/01-google-oauth-client-and-auth-secrets.md).

The feature spec has no user story for this infra task (spec gap, reported), so cases are named
after the task's Verification items: T01-V1 to T01-V4. Names only; no secret value is read or printed.
"""
import json
import os
import re
import shutil

import pytest

from helpers import ROOT, run

def _steps(workflow):
    return workflow["jobs"]["deploy"]["steps"]


def _deploy_step(workflow):
    return next(s for s in _steps(workflow) if "wrangler-action" in s.get("uses", ""))


def test_T01_V1a_workflow_pushes_the_three_secrets_to_the_worker(workflow, secrets):
    """T01-V1 (task 01 Verification 1, static half): wrangler-action secrets list and env carry the three names."""
    step = _deploy_step(workflow)
    listed = step["with"]["secrets"].split()
    for name in secrets + ["DATABASE_URL"]:
        assert name in listed, f"{name} missing from wrangler-action secrets"
        assert step["env"][name] == "${{ secrets.%s }}" % name


def test_T01_V1b_workflow_fails_early_when_a_secret_is_missing(workflow, secrets):
    """T01-V1 (failure path): each name has a 'Require' step before deploy that exits 1 when empty."""
    steps = _steps(workflow)
    deploy_idx = steps.index(_deploy_step(workflow))
    for name in secrets:
        idx = next((i for i, s in enumerate(steps) if s.get("name") == f"Require {name}"), None)
        assert idx is not None and idx < deploy_idx, f"no 'Require {name}' step before deploy"
        assert steps[idx]["env"][name] == "${{ secrets.%s }}" % name
        script = steps[idx]["run"]
        assert "exit 1" in script and f'test -n "${name}"' in script
        assert not re.search(rf"(echo|printf|cat)[^|;&\n]*\$\{{?{name}", script), "secret value printed"
        assert "set -x" not in script and "set -o xtrace" not in script
        assert "secrets." not in script, "secret inlined in run script"


def test_T01_V1c_wrangler_secret_list_on_dev(secrets):
    """T01-V1 (dynamic half): `wrangler secret list --env dev` shows the three names (names only)."""
    if not shutil.which("pnpm") or not (os.environ.get("CLOUDFLARE_API_TOKEN") and os.environ.get("CLOUDFLARE_ACCOUNT_ID")):
        pytest.skip("BLOCKED: needs Cloudflare credentials to run `wrangler secret list --env dev`")
    r = run(["pnpm", "exec", "wrangler", "secret", "list", "-c", "wrangler.jsonc", "--env", "dev"])
    assert r.returncode == 0, r.stderr[-300:]
    names = [x["name"] for x in json.loads(r.stdout)]
    for name in secrets:
        assert name in names, f"{name} not bound to the dev Worker"


def test_T01_V1d_secrets_exist_in_github_environment(secrets):
    """T01 checklist: the three secrets exist in GitHub Environment `dev` (`gh secret list`, names only)."""
    if not shutil.which("gh") or run(["gh", "auth", "status"]).returncode != 0:
        pytest.skip("BLOCKED: needs a signed-in `gh` to list GitHub Environment secrets")
    r = run(["gh", "secret", "list", "--env", "dev"])
    if r.returncode != 0:
        pytest.skip("BLOCKED: `gh secret list --env dev` not permitted: " + r.stderr[-200:])
    names = [line.split()[0] for line in r.stdout.splitlines() if line.strip()]
    for name in secrets:
        assert name in names, f"{name} missing from GitHub Environment dev"


def test_T01_V2a_env_example_has_the_keys_empty(secrets):
    """T01-V2: .env.example declares each key with an empty value."""
    lines = (ROOT / ".env.example").read_text().splitlines()
    for name in secrets + ["BETTER_AUTH_URL"]:
        assert f"{name}=" in lines, f"{name}= (empty) missing from .env.example"


def test_T01_V2b_no_real_values_in_tracked_files(secrets):
    """T01-V2 (security): git grep over all tracked files (docs included) finds no real value; .dev.vars is ignored."""
    patterns = [
        r"(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|BETTER_AUTH_SECRET)\s*[=:]\s*['\"]?[A-Za-z0-9_./+-]{8,}",
        r"GOCSPX-[A-Za-z0-9_-]{8,}",
        r"[0-9]{6,}-[A-Za-z0-9_]+\.apps\.googleusercontent\.com",
    ]
    for pat in patterns:
        r = run(["git", "grep", "-nE", pat, "--", "."])
        # Workflow expressions (${{ secrets.X }}) and placeholders such as <account> do not match the classes.
        assert r.returncode == 1, f"possible real value committed:\n{re.sub(r'[=:].*', '=<redacted>', r.stdout)}"
    ignored = run(["git", "check-ignore", ".dev.vars", ".env"])
    assert ignored.stdout.split() == [".dev.vars", ".env"]


def test_T01_V3_infra_docs_list_setup_and_rotation(secrets):
    """T01-V3: dev-environment.md and local-development.md document the secrets, setup and rotation."""
    dev = (ROOT / "docs/infra/dev-environment.md").read_text()
    local = (ROOT / "docs/infra/local-development.md").read_text()
    for name in secrets:
        assert name in dev and name in local
    assert "localhost:3000/api/auth/callback/google" in local
    assert "/api/auth/callback/google" in dev and "workers.dev/api/auth/callback/google" in dev
    assert re.search(r"rotate:.*github environment secret.*re-run", dev, re.I), "rotation steps missing"
    assert "signs everyone out" in dev or "signs everyone out" in local
    assert ".dev.vars" in local


def test_T01_V4_env_types_declare_the_keys(secrets):
    """T01-V4: src/env.d.ts declares the keys (Vitest covers the same in src/)."""
    types = (ROOT / "src/env.d.ts").read_text()
    for name in secrets:
        assert re.search(rf"\b{name}\??:\s*string", types)


def test_T01_V5_google_cloud_oauth_client_configured():
    """T01 checklist: OAuth client, consent screen, redirect URIs exist."""
    pytest.skip("BLOCKED: maintainer step in Google Cloud Console (and Q-consent), not observable from here")
