"""Shared fixtures for the dev-test-database e2e suite.

This feature is infra only (Neon branch, Worker secret, docs). Scenarios are checked as:
  - the committed repo, workflow and docs (static, run anywhere),
  - the deployed app at E2E_BASE_URL (the dev URL; skips as BLOCKED when unset or local,
    set E2E_ALLOW_LOCAL=1 to opt in to a local `pnpm start`),
  - read-only `gh` queries of past run logs.
Scenarios that need the Neon dashboard or Cloudflare credentials are BLOCKED (skipped
with the reason): this suite never touches Neon or the dev Worker secret. Never use production.
"""
import ipaddress
import os
import shutil
from urllib.parse import urlparse

import pytest

from helpers import ROOT, run

BASE_URL = os.environ.get("E2E_BASE_URL", "").rstrip("/")
ALLOW_LOCAL = os.environ.get("E2E_ALLOW_LOCAL") == "1"


def _is_local_host(host):
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


@pytest.fixture
def api(pw, base_url):
    req = pw.request.new_context(base_url=base_url)
    yield req
    req.dispose()


@pytest.fixture(scope="session")
def tracked_files():
    r = run(["git", "ls-files"])
    assert r.returncode == 0, r.stderr
    return [ROOT / f for f in r.stdout.splitlines() if (ROOT / f).is_file()]
