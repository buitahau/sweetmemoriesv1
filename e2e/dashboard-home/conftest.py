"""Shared fixtures for the dashboard-home e2e suite (docs/features/dashboard-home.md).

Signed-in scenarios seed a User and Session with helpers.seed_signed_in_session (ADR 0009) and skip as
BLOCKED without the seeding env vars (see e2e/README.md, "Session seeding"). Never run against production.
"""
import os

import pytest

from helpers import SeedRefused, delete_seeded_user, seed_signed_in_session

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")


@pytest.fixture(scope="module")
def browser(pw):
    b = pw.chromium.launch()
    yield b
    b.close()


@pytest.fixture
def ctx(browser):
    c = browser.new_context(viewport={"width": 1440, "height": 900})
    yield c
    c.close()


@pytest.fixture(scope="module")
def auth_configured(pw):
    """Skip as BLOCKED when the server has no auth config: every cookie then reads as signed out."""
    req = pw.request.new_context()
    try:
        status = req.get(f"{BASE}/api/auth/get-session").status
    finally:
        req.dispose()
    if status != 200:
        pytest.skip(f"BLOCKED: server has no auth config (/api/auth/get-session answered {status})")


@pytest.fixture
def seed():
    """Factory: seed_signed_in_session(name=..., lifetime_days=...) with cleanup; BLOCKED when seeding is unavailable."""
    created = []

    def make(**kwargs):
        try:
            s = seed_signed_in_session(BASE, **kwargs)
        except SeedRefused as e:
            pytest.skip(
                f"BLOCKED: {e}. Signed-in scenarios need a local server and the seed variables "
                "(E2E_SEED_DATABASE_URL, E2E_SEED_NEON_ENDPOINT, E2E_BETTER_AUTH_SECRET; ADR 0009, e2e/README.md)"
            )
        created.append(s["user_id"])
        return s

    yield make
    for user_id in created:
        delete_seeded_user(user_id, BASE)


@pytest.fixture
def browser_with(browser):
    """Factory: a fresh browser context holding one session cookie (dict with cookie_name and cookie_value)."""
    contexts = []

    def make(cookie):
        c = browser.new_context(viewport={"width": 1440, "height": 900})
        c.add_cookies([{"name": cookie["cookie_name"], "value": cookie["cookie_value"], "url": BASE}])
        contexts.append(c)
        return c

    yield make
    for c in contexts:
        c.close()
