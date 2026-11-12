"""Fixtures shared by every e2e suite.

Playwright's sync API allows one running session per process, so the `pw`
fixture lives here. Suites run together (`pytest e2e/...`) then share it
instead of each starting its own, which raised "Sync API inside the asyncio loop".
"""
import pytest
from playwright.sync_api import sync_playwright


@pytest.fixture(scope="session")
def pw():
    with sync_playwright() as p:
        yield p
