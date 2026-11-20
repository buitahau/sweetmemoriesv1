"""US-google-sign-in-5 as delivered by task 08 (docs/tasks/google-sign-in/08-redirect-signed-in-users-from-sign-in.md).

One test per scenario:
  5.1 signed-in User opening /sign-in is redirected to /dashboard (needs a seeded session, ADR 0009)
  5.2 expired or invalid session cookie: the Login page shows normally
plus the task 08 verification item (T08_V3): anonymous /sign-in sets no Set-Cookie header and no cookie.

5.1 is BLOCKED unless E2E_SESSION_COOKIE ("name=value", a session cookie seeded per ADR 0009 into a
local or test database) is set; task 10 adds the seeding helper (helpers.seed_signed_in_session). Never type real Google
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
# Better Auth prefixes the cookie with __Secure- when the server runs on https (useSecureCookies).
COOKIE_NAME = ("__Secure-" if BASE.startswith("https://") else "") + "better-auth.session_token"


def _shot(page, name):
    SHOTS.mkdir(exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{name}.png"))


def _add_cookie(ctx, name, value):
    ctx.add_cookies([{"name": name, "value": value, "url": BASE}])


def _assert_login_page(page):
    expect(page.get_by_role("heading", level=1, name="Welcome! Come on in.")).to_be_visible()
    expect(page.get_by_role("button", name="Continue with Google")).to_be_visible()


@pytest.mark.parametrize("entry", ["direct", "homepage_link"])
def test_US_google_sign_in_5_1_signed_in_user_is_redirected_to_dashboard(ctx, entry):
    """US-google-sign-in-5.1 (happy, session: user): a signed-in User opening /sign-in, directly or via the homepage "Sign in" link, lands on /dashboard."""
    seeded = os.environ.get("E2E_SESSION_COOKIE", "")
    if "=" not in seeded:
        pytest.skip("BLOCKED: no seeded session (set E2E_SESSION_COOKIE=name=value, ADR 0009; or run the seeded 5.1 in test_google_sign_in_task10_signed_in.py)")
    name, value = seeded.split("=", 1)
    _add_cookie(ctx, name, value)
    page = ctx.new_page()
    if entry == "direct":
        page.goto(f"{BASE}/sign-in", wait_until="networkidle")
    else:
        page.goto(f"{BASE}/", wait_until="networkidle")
        page.get_by_role("link", name="Sign in").first.click()
        page.wait_for_url("**/dashboard", wait_until="networkidle")
    _shot(page, f"task08_5_1_signed_in_redirect_{entry}")
    assert urlparse(page.url).path == "/dashboard"
    expect(page.get_by_role("button", name="Continue with Google")).to_have_count(0)


@pytest.fixture(scope="module")
def auth_configured(pw):
    """Skip as BLOCKED when the server has no auth config: getSession then returns null for every cookie."""
    req = pw.request.new_context()
    try:
        status = req.get(f"{BASE}/api/auth/get-session").status
    finally:
        req.dispose()
    if status != 200:
        pytest.skip(f"BLOCKED: server has no auth config (/api/auth/get-session answered {status})")


@pytest.mark.parametrize("cookie_value", ["not-a-valid-token", "forged.value.signature"])
def test_US_google_sign_in_5_2_invalid_session_cookie_shows_login_page(ctx, auth_configured, cookie_value):
    """US-google-sign-in-5.2 (failure/edge, session: public): an invalid or expired session cookie shows the Login page."""
    _add_cookie(ctx, COOKIE_NAME, cookie_value)
    page = ctx.new_page()
    resp = page.goto(f"{BASE}/sign-in", wait_until="networkidle")
    _shot(page, "task08_5_2_invalid_cookie")
    assert resp is not None and resp.status == 200
    assert urlparse(page.url).path == "/sign-in"
    _assert_login_page(page)


def test_T08_V3_anonymous_sign_in_sets_no_cookie(ctx):
    """Task 08 Verification / US-google-sign-in-6.1 (security, session: public): anonymous /sign-in sets no cookie, not even a deleting one."""
    set_cookie = []

    def on_response(r):
        try:
            value = r.header_value("set-cookie")  # r.headers omits set-cookie in Playwright
        except Exception:
            return
        if value:
            set_cookie.append((r.url, value))

    page = ctx.new_page()
    page.on("response", on_response)
    page.goto(f"{BASE}/sign-in", wait_until="networkidle")
    _shot(page, "task08_V3_anonymous_no_cookie")
    _assert_login_page(page)
    assert set_cookie == [], f"responses set cookies: {set_cookie}"
    assert ctx.cookies() == []
