"""Shared fixtures for the ci-pr-checks e2e suite.

This feature is backend/infra only (GitHub Actions workflow and branch
protection), so there is no browser. Scenarios are checked three ways:
  - the committed workflow file (static, runs anywhere),
  - local reproduction of the failing inputs with the same commands `ci` runs,
  - the live GitHub API via `gh` (branch protection).
Scenarios that need a real PR run on GitHub are marked BLOCKED (skipped with
the reason) because this suite must not push or open PRs.
"""
import json
import re
import shutil
import subprocess

import pytest
import yaml

from helpers import ROOT

WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"
PROTECTED_BRANCHES = ["dev-v2", "main"]


@pytest.fixture(scope="session")
def workflow():
    return yaml.safe_load(WORKFLOW.read_text())


@pytest.fixture(scope="session")
def workflow_text():
    return WORKFLOW.read_text()


@pytest.fixture(scope="session")
def package_json():
    return json.loads((ROOT / "package.json").read_text())


@pytest.fixture(scope="session", params=PROTECTED_BRANCHES)
def protection(request):
    """Live branch protection for dev-v2 and main (parametrized) via gh, as a (branch, data) tuple. Skips only when gh is missing or
    unauthenticated/offline; a 404 (not protected) yields (branch, None) and the tests fail on it.
    A missing branch fails. Note: this reads classic branch protection only (what
    scripts/ci-branch-protection.sh applies). If protection is ever moved to a ruleset, this
    fixture and the script must be extended to read the rulesets API, or they will report it as unprotected."""
    branch = request.param
    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh CLI not installed")
    r = subprocess.run(
        ["gh", "api", f"repos/:owner/:repo/branches/{branch}/protection"],
        cwd=ROOT, capture_output=True, text=True,
    )
    if r.returncode != 0:
        err = r.stderr + r.stdout
        if "Branch not protected" in err:
            # Sentinel: tests assert on it so a missing rule is a FAIL, not a fixture ERROR.
            return branch, None
        if "Branch not found" in err:
            # The protected branch names are fixed; a missing or renamed branch is a failure, not a skip.
            pytest.fail(f"protected branch {branch} not found on the repository")
        status = re.search(r"HTTP (\d{3})", err)
        code = f" (HTTP {status.group(1)})" if status else ""
        pytest.skip(f"BLOCKED: cannot read branch protection via gh{code}: {r.stderr.strip()[:200]}")
    return branch, json.loads(r.stdout)
