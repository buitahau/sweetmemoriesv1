"""Shared fixtures for the dev-deploy e2e suite.

dev-deploy is mostly infra (workflow, Wrangler config, smoke check, docs). Scenarios
are checked four ways:
  - the committed workflow, wrangler config and docs (static, run anywhere),
  - the real smoke script run against a throwaway local HTTP server,
  - the deployed app at E2E_BASE_URL (local `pnpm start` by default, or the dev URL),
  - read-only `gh` queries of past runs.
Scenarios that need a real merge, a broken deploy or the Cloudflare dashboard are
BLOCKED (skipped with the reason): this suite must not push, merge or touch Cloudflare.
Never point E2E_BASE_URL at production.
"""
import json
import os
import pathlib
import shutil
import subprocess

import pytest
import yaml
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "deploy-dev.yml"
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")
SHOTS = pathlib.Path(__file__).parent / "screenshots"


def run(cmd, cwd=ROOT, timeout=300, env=None):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)


@pytest.fixture(scope="session")
def workflow():
    return yaml.safe_load(WORKFLOW.read_text())


@pytest.fixture(scope="session")
def workflow_text():
    return WORKFLOW.read_text()


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def pw():
    with sync_playwright() as p:
        yield p


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
    """Completed deploy-dev runs (newest first) via read-only gh, or skip."""
    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh CLI not installed")
    r = run(["gh", "run", "list", "--workflow", "deploy-dev", "--limit", "20", "--json",
             "databaseId,conclusion,status,headSha,headBranch,event,createdAt,updatedAt"])
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: gh run list failed: {r.stderr.strip()[:200]}")
    runs = json.loads(r.stdout)
    if not runs:
        pytest.skip("BLOCKED: no deploy-dev run exists yet (needs a merge into dev-v2)")
    return runs
