"""Shared fixtures for the project-skeleton e2e suite.

Run against a local or dev URL, never production:
    E2E_BASE_URL=http://localhost:3000 pytest e2e/project-skeleton
"""
import os
import pathlib

import pytest
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")
SHOTS = pathlib.Path(__file__).parent / "screenshots"


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
    # Fresh context per test: no cookies, no storage.
    ctx = browser.new_context()
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
