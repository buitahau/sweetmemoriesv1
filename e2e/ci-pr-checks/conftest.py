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
import pathlib
import shutil
import subprocess

import pytest
import yaml

ROOT = pathlib.Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"
PROTECTED_BRANCH = "dev-v2"


@pytest.fixture(scope="session")
def workflow():
    return yaml.safe_load(WORKFLOW.read_text())


@pytest.fixture(scope="session")
def workflow_text():
    return WORKFLOW.read_text()


@pytest.fixture(scope="session")
def package_json():
    return json.loads((ROOT / "package.json").read_text())


@pytest.fixture(scope="session")
def protection():
    """Live branch protection for dev-v2 via gh, or skip when unavailable."""
    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh CLI not installed")
    r = subprocess.run(
        ["gh", "api", f"repos/:owner/:repo/branches/{PROTECTED_BRANCH}/protection"],
        cwd=ROOT, capture_output=True, text=True,
    )
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: cannot read branch protection via gh: {r.stderr.strip()[:200]}")
    return json.loads(r.stdout)


def run(cmd, cwd=ROOT, timeout=300):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
