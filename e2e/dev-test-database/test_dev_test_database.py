"""E2E tests for docs/features/dev-test-database.md (US-devdb-1 .. US-devdb-3).

One test per Given/When/Then scenario. Scenarios that need the Neon dashboard or the
Cloudflare account are BLOCKED (skipped with the reason); where part of a scenario is
checkable from the repo, docs or deployed app, that part is asserted in the test.
"""
import json
import os
import re
import shutil

import pytest

from helpers import ROOT, run

DOCS = ROOT / "docs" / "infra" / "dev-environment.md"
ENV_EXAMPLE = ROOT / ".env.example"
WORKFLOWS = ROOT / ".github" / "workflows"
BLOCKED_NEON = "BLOCKED: needs the Neon dashboard/API, which this suite cannot read"
BLOCKED_CF = "BLOCKED: needs Cloudflare credentials to run `wrangler secret list --env dev`"

# A Postgres connection string with credentials, or any neon.tech host.
CONN_STRING = re.compile(r"postgres(?:ql)?://[^\s/:@]+:[^\s@]+@", re.I)
NEON_HOST = re.compile(r"[\w.-]*neon\.tech", re.I)
# Obvious placeholders and the unit-test fakes (`fakeuser`, `ep-fake`) are not real credentials.
PLACEHOLDER = re.compile(r"postgres(?:ql)?://(?:user|username|fake\w*):(?:pass\w*|password|fake\w*|\*+)@", re.I)
FAKE_HOST = re.compile(r"postgres(?:ql)?://[^\s]*(?:ep-fake|\.example)[^\s]*neon\.tech", re.I)


# ---------- US-devdb-1: Dev has its own test database ----------

def test_US_devdb_1_1_neon_dev_branch_exists_separate_from_main():
    """US-devdb-1.1 (story US-devdb-1): a Neon branch `dev` exists beside main. Docs part is static."""
    text = DOCS.read_text()
    assert "`dev`" in text and "child of the project's main branch" in text
    pytest.skip(BLOCKED_NEON + " (docs name the branch; existence not verified)")


def test_US_devdb_1_2_database_url_secret_bound_to_dev_worker():
    """US-devdb-1.2 (story US-devdb-1): `wrangler secret list --env dev` lists DATABASE_URL."""
    if not shutil.which("pnpm") or not (os.environ.get("CLOUDFLARE_API_TOKEN") and os.environ.get("CLOUDFLARE_ACCOUNT_ID")):
        pytest.skip(BLOCKED_CF)
    r = run(["pnpm", "exec", "wrangler", "secret", "list", "-c", "wrangler.jsonc", "--env", "dev"])
    assert r.returncode == 0, r.stderr[-300:]
    names = [s["name"] for s in json.loads(r.stdout)]
    assert "DATABASE_URL" in names


def test_US_devdb_1_3_local_env_is_not_dev_secret():
    """US-devdb-1.3 (story US-devdb-1): `.env.example` documents DATABASE_URL with no value; local .env is untracked."""
    lines = [l for l in ENV_EXAMPLE.read_text().splitlines() if l.startswith("DATABASE_URL")]
    assert lines == ["DATABASE_URL="], "DATABASE_URL must be listed with no value"
    tracked = run(["git", "ls-files", ".env"]).stdout.strip()
    assert tracked == "", ".env must never be committed"
    assert run(["git", "check-ignore", ".env"]).returncode == 0, ".env must be git-ignored"
    assert "Never use the dev Worker's database here" in ENV_EXAMPLE.read_text()


def test_US_devdb_1_4_deploy_does_not_touch_secrets():
    """US-devdb-1.4 (story US-devdb-1): static, deploy-dev never sets, deletes or bulk-writes Worker secrets."""
    text = (WORKFLOWS / "deploy-dev.yml").read_text()
    assert not re.search(r"wrangler\s+(?:secret|versions\s+secret)|secrets?:\s*\|", text, re.I), \
        "deploy-dev must not manage Worker secrets (DATABASE_URL is set once by a maintainer)"
    assert "DATABASE_URL" not in text


# ---------- US-devdb-2: Database credentials are never exposed ----------

def test_US_devdb_2_1_no_connection_string_in_repo(tracked_files):
    """US-devdb-2.1 (story US-devdb-2): no neon.tech connection string or password in tracked files."""
    offenders = []
    for f in tracked_files:
        try:
            text = f.read_text()
        except (UnicodeDecodeError, OSError):
            continue
        for m in CONN_STRING.finditer(text):
            if not PLACEHOLDER.match(m.group(0)):
                offenders.append(f"{f.relative_to(ROOT)}: connection string with credentials")
        hit = re.search(r"postgres(?:ql)?://[^\s]*neon\.tech", text, re.I)
        if hit and not FAKE_HOST.match(hit.group(0)):
            offenders.append(f"{f.relative_to(ROOT)}: neon.tech connection string")
    assert not offenders, offenders


def test_US_devdb_2_2_no_database_url_value_in_run_logs():
    """US-devdb-2.2 (story US-devdb-2): recent ci and deploy-dev logs contain no connection string."""
    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh CLI not installed")
    r = run(["gh", "run", "list", "--limit", "5", "--json", "databaseId,workflowName"])
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: gh run list failed: {r.stderr.strip()[:200]}")
    runs = json.loads(r.stdout)
    if not runs:
        pytest.skip("BLOCKED: no ci or deploy-dev run exists yet")
    checked = 0
    for item in runs:
        log = run(["gh", "run", "view", str(item["databaseId"]), "--log"])
        if log.returncode != 0:
            continue
        checked += 1
        assert not CONN_STRING.search(log.stdout), f"run {item['databaseId']} log has a connection string"
        assert not NEON_HOST.search(log.stdout), f"run {item['databaseId']} log mentions a neon.tech host"
    if not checked:
        pytest.skip("BLOCKED: no run log could be read via gh")


@pytest.mark.parametrize("path", ["/", "/api/health"])
def test_US_devdb_2_3_no_database_credentials_in_responses(api, path):
    """US-devdb-2.3 (story US-devdb-2): `/` and `/api/health` expose no DB host, user or password."""
    res = api.get(path)
    assert res.status == 200
    body = res.text() + json.dumps(res.headers)
    assert not NEON_HOST.search(body)
    assert not CONN_STRING.search(body)
    assert "DATABASE_URL" not in body
    assert "postgres" not in body.lower()


def test_US_devdb_2_4_least_privilege_role():
    """US-devdb-2.4 (story US-devdb-2): role is non-owner and scoped to the dev branch. Docs part is static."""
    text = DOCS.read_text()
    assert "non-owner role scoped to that branch database" in text
    pytest.skip(BLOCKED_NEON + " (docs state the policy; the real role grants not inspected)")


# ---------- US-devdb-3: Testers can reset the test database ----------

def test_US_devdb_3_1_reset_steps_documented():
    """US-devdb-3.1 (story US-devdb-3): docs/infra/dev-environment.md has reset steps and says no redeploy is needed."""
    text = DOCS.read_text()
    assert "Reset the dev branch" in text
    assert "reset" in text and "parent" in text
    assert "needs no redeploy" in text


def test_US_devdb_3_1b_health_ok_on_dev(api):
    """US-devdb-3.1 live part (story US-devdb-3): `/api/health` returns 200 (checked after any reset; the reset itself is BLOCKED)."""
    assert api.get("/api/health").status == 200


def test_US_devdb_3_2_reset_leaves_production_branch_untouched():
    """US-devdb-3.2 (story US-devdb-3): reset of `dev` leaves the parent branch unchanged."""
    text = DOCS.read_text()
    assert "Production never shares a branch or credentials with dev" in text
    pytest.skip(BLOCKED_NEON + " (a real reset on shared Neon is not run by this suite)")
