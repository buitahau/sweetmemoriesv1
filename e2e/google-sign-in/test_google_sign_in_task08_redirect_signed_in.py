"""US-google-sign-in-5 as delivered by task 08 (docs/tasks/google-sign-in/08-redirect-signed-in-users-from-sign-in.md).

One test per scenario:
  5.1 signed-in User opening /sign-in is redirected to /dashboard (needs a seeded session, ADR 0009)
  5.2 expired or invalid session cookie: the Login page shows normally
plus the task's verification item: anonymous /sign-in sets no cookie.

5.1 is BLOCKED unless E2E_SESSION_COOKIE ("name=value", a session cookie seeded per ADR 0009 into a
local or test database) is set; the seeding helper arrives with task 10. Never type real Google
credentials. /dashboard answers 404 until dashboard-home 01 lands, so 5.1 asserts the URL path only.
Run against a local or dev URL, never production:
    E2E_BASE_URL=http://localhost:3000 pytest e2e/google-sign-in/test_google_sign_in_task08_redirect_signed_in.py -rs
Screenshots go to e2e/google-sign-in/screenshots (git-ignored).
"""
import os
import pathlib
from urllib.parse import urlparse

import pytest
from playwright.sync_api import expect

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")
SHOTS = pathlib.Path(__file__).parent / "screenshots"
COOKIE_NAME = "better-auth.session_token"


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


def _shot(page, name):
    SHOTS.mkdir(exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{name}.png"))


def _add_cookie(ctx, name, value):
    ctx.add_cookies([{"name": name, "value": value, "url": BASE}])


def _assert_login_page(page):
    expect(page.get_by_role("heading", level=1, name="Welcome! Come on in.")).to_be_visible()
    expect(page.get_by_role("button", name="Continue with Google")).to_be_visible()


def test_US_google_sign_in_5_1_signed_in_user_is_redirected_to_dashboard(ctx):
    """US-google-sign-in-5.1 (happy, session: user): a signed-in User opening /sign-in lands on /dashboard."""
    seeded = os.environ.get("E2E_SESSION_COOKIE", "")
    if "=" not in seeded:
        pytest.skip("BLOCKED: no seeded session (set E2E_SESSION_COOKIE=name=value, ADR 0009; helper arrives with task 10)")
    name, value = seeded.split("=", 1)
    _add_cookie(ctx, name, value)
    page = ctx.new_page()
    page.goto(f"{BASE}/sign-in", wait_until="networkidle")
    _shot(page, "task08_5_1_signed_in_redirect")
    assert urlparse(page.url).path == "/dashboard"
    expect(page.get_by_role("button", name="Continue with Google")).to_have_count(0)


@pytest.mark.parametrize("cookie_value", ["not-a-valid-token", "forged.value.signature"])
def test_US_google_sign_in_5_2_invalid_session_cookie_shows_login_page(ctx, cookie_value):
    """US-google-sign-in-5.2 (failure/edge, session: public): an invalid or expired session cookie shows the Login page."""
    _add_cookie(ctx, COOKIE_NAME, cookie_value)
    page = ctx.new_page()
    resp = page.goto(f"{BASE}/sign-in", wait_until="networkidle")
    _shot(page, "task08_5_2_invalid_cookie")
    assert resp is not None and resp.status == 200
    assert urlparse(page.url).path == "/sign-in"
    _assert_login_page(page)


def test_US_google_sign_in_5_2b_anonymous_visit_sets_no_cookie(ctx):
    """US-google-sign-in-5 / task 08 verification (security, session: public): anonymous /sign-in sets no cookie."""
    set_cookie = []
    page = ctx.new_page()
    page.on("response", lambda r: set_cookie.append(r.url) if "set-cookie" in r.headers else None)
    page.goto(f"{BASE}/sign-in", wait_until="networkidle")
    _assert_login_page(page)
    assert set_cookie == [], f"responses set cookies: {set_cookie}"
    assert ctx.cookies() == []
