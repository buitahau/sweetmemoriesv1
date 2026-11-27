"""Shared fixtures for the homepage-seo e2e suite (docs/features/homepage-seo.md).

Run against a local or dev URL, never production:
    E2E_BASE_URL=http://localhost:3000 .venv-e2e/bin/pytest e2e/homepage-seo -rs

One file per task: task 01 (site config), task 02 (static assets), task 03 (the `/` head tags, one
test per scenario, with the E2E_SEO_PROFILE profiles documented in e2e/README.md).
"""
import os
import pathlib
import urllib.error
import urllib.request
from urllib.parse import urlparse

import pytest

SHOTS = pathlib.Path(__file__).parent / "screenshots"
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")

_HOST = urlparse(BASE_URL).hostname or ""
if _HOST == "sweetmemories.com" or _HOST.endswith(".sweetmemories.com"):
    raise RuntimeError("homepage-seo e2e never runs against production")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def fetch():
    """Raw HTTP GET without JavaScript; returns (status, headers, body). Skips as BLOCKED when no server answers."""

    def _fetch(path, headers=None):
        req = urllib.request.Request(BASE_URL + path, headers={"User-Agent": "e2e-homepage-seo", **(headers or {})})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status, r.headers, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.code, e.headers, e.read().decode("utf-8", "replace")
        except urllib.error.URLError as e:
            pytest.skip(f"BLOCKED: no server at {BASE_URL} ({e.reason})")

    return _fetch


@pytest.fixture(scope="module")
def browser(pw):
    b = pw.chromium.launch()
    yield b
    b.close()


@pytest.fixture
def shot():
    SHOTS.mkdir(exist_ok=True)

    def _shot(page, name):
        page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=False)
        return SHOTS / f"{name}.png"

    return _shot
