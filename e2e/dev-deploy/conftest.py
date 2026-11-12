"""Shared fixtures for the dev-deploy e2e suite.

dev-deploy is mostly infra (workflow, Wrangler config, smoke check, docs). Scenarios
are checked four ways:
  - the committed workflow, wrangler config and docs (static, run anywhere),
  - the real smoke script run against a throwaway local HTTP server,
  - the deployed app at E2E_BASE_URL (the dev URL; required). Without it, or when it points at
    localhost, those scenarios skip as BLOCKED so local passes are not mistaken for dev evidence.
    Set E2E_ALLOW_LOCAL=1 to opt in to running them against a local `pnpm start`,
  - read-only `gh` queries of past runs.
Scenarios that need a real merge, a broken deploy or the Cloudflare dashboard are
BLOCKED (skipped with the reason): this suite must not push, merge or touch Cloudflare.
Never point E2E_BASE_URL at production.
"""
import ipaddress
import json
import os
import pathlib
import shutil
from urllib.parse import urlparse

import pytest
import yaml

from helpers import ROOT, run

WORKFLOW = ROOT / ".github" / "workflows" / "deploy-dev.yml"
BASE_URL = os.environ.get("E2E_BASE_URL", "").rstrip("/")
ALLOW_LOCAL = os.environ.get("E2E_ALLOW_LOCAL") == "1"
SHOTS = pathlib.Path(__file__).parent / "screenshots"


@pytest.fixture(scope="session")
def workflow():
    return yaml.safe_load(WORKFLOW.read_text())


@pytest.fixture(scope="session")
def workflow_text():
    return WORKFLOW.read_text()


def _is_local_host(host):
    """True for localhost names (incl. *.localhost), 0.0.0.0 and loopback/private/unspecified IPs."""
    host = host.lower().rstrip(".")
    if host == "localhost" or host.endswith(".localhost"):
        return True
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return False
    return ip.is_loopback or ip.is_private or ip.is_unspecified or ip.is_link_local


@pytest.fixture(scope="session")
def base_url():
    if not BASE_URL:
        if ALLOW_LOCAL:
            return "http://localhost:3000"
        pytest.skip("BLOCKED: no dev URL (E2E_BASE_URL unset); set E2E_ALLOW_LOCAL=1 to run against localhost")
    host = urlparse(BASE_URL).hostname or ""
    if _is_local_host(host):
        if not ALLOW_LOCAL:
            pytest.skip("BLOCKED: E2E_BASE_URL points at a local address, not dev; set E2E_ALLOW_LOCAL=1 to opt in")
    elif "sweetmemories-dev" not in host or not host.endswith(".workers.dev"):
        pytest.fail(f"E2E_BASE_URL {BASE_URL} is not a dev Worker (*.workers.dev containing sweetmemories-dev); never use production")
    return BASE_URL


@pytest.fixture(scope="session")
def browser(pw):
    b = pw.chromium.launch(headless=True)
    yield b
    b.close()


@pytest.fixture
def context(browser):
    ctx = browser.new_context()  # fresh: no cookies, no storage
    yield ctx
    ctx.close()


@pytest.fixture
def page(context):
    return context.new_page()


@pytest.fixture
def api(pw, base_url):
    req = pw.request.new_context(base_url=base_url)
    yield req
    req.dispose()


@pytest.fixture
def shot():
    SHOTS.mkdir(exist_ok=True)

    def _shot(page, name):
        page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)

    return _shot


@pytest.fixture(scope="session")
def deploy_runs():
    """Runs of the v2 deploy-dev workflow on dev-v2 (newest first) via read-only gh, or skip.

    The file name deploy-dev.yml was also used by the v1 workflow, so runs are limited to
    the dev-v2 branch; runs from other branches come from `off_branch_runs`.
    """
    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh CLI not installed")
    r = run(["gh", "run", "list", "--workflow", "deploy-dev.yml", "--branch", "dev-v2", "--limit", "20", "--json",
             "databaseId,conclusion,status,headSha,headBranch,event,createdAt,updatedAt"])
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: gh run list failed: {r.stderr.strip()[:200]}")
    runs = json.loads(r.stdout)
    if not runs:
        pytest.skip("BLOCKED: no deploy-dev run exists yet (needs a merge into dev-v2)")
    return runs


@pytest.fixture(scope="session")
def off_branch_runs():
    """Manual (workflow_dispatch) deploy-dev runs from branches other than dev-v2, or skip."""
    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh CLI not installed")
    r = run(["gh", "run", "list", "--workflow", "deploy-dev.yml", "--event", "workflow_dispatch",
             "--limit", "50", "--json", "databaseId,headBranch,event"])
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: gh run list failed: {r.stderr.strip()[:200]}")
    return [x for x in json.loads(r.stdout) if x["headBranch"] != "dev-v2"]
