"""US-dashboard-home-1 to 3 (docs/features/dashboard-home.md), one test per Given/When/Then scenario.

Written for task 01 (docs/tasks/dashboard-home/01-protected-dashboard-route-and-loader.md): the protected
/dashboard route, its loader ({ firstName } only), Cache-Control no-store and robots noindex.
The Sign out button arrives in tasks 02 and 03, so the parts of 1.1 and 3.1 to 3.3 that need it are skipped
as BLOCKED until SIGN_OUT_DELIVERED is set to True (task 04 flips it and expects no skips).

Signed-in scenarios seed Users and Sessions (helpers.seed_signed_in_session, ADR 0009) and skip as BLOCKED
without E2E_SEED_DATABASE_URL, E2E_SEED_NEON_ENDPOINT and E2E_BETTER_AUTH_SECRET (see e2e/README.md).
Run against a local server, never production:
    E2E_BASE_URL=http://localhost:3000 .venv-e2e/bin/pytest e2e/dashboard-home -rs
Screenshots go to e2e/dashboard-home/screenshots (not committed).
"""
import os
import pathlib
import uuid
from urllib.parse import urlparse

import pytest
from playwright.sync_api import expect

from helpers import SeedRefused, add_seeded_session, session_cookie_name, sign_cookie_value

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")
SHOTS = pathlib.Path(__file__).parent / "screenshots"
COOKIE_NAME = session_cookie_name(BASE)

# Flip to True once dashboard-home tasks 02 (Sign out button) and 03 (sign-out flow) land.
SIGN_OUT_DELIVERED = False
SIGN_OUT_PENDING = "BLOCKED: the Sign out button and flow land in dashboard-home tasks 02 and 03"
needs_sign_out = pytest.mark.skipif(not SIGN_OUT_DELIVERED, reason=SIGN_OUT_PENDING)


def _shot(page, name):
    SHOTS.mkdir(exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)


def _open_dashboard(context, shot):
    page = context.new_page()
    resp = page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    _shot(page, shot)
    return page, resp


def _get_session(pw, cookie_name, cookie_value):
    """The Better Auth session for a cookie, or None (what the server thinks of this cookie)."""
    req = pw.request.new_context(extra_http_headers={"cookie": f"{cookie_name}={cookie_value}"})
    try:
        r = req.get(f"{BASE}/api/auth/get-session")
        return r.json() if r.status == 200 and r.text() not in ("", "null") else None
    finally:
        req.dispose()


def _assert_on_sign_in(page):
    assert urlparse(page.url).path == "/sign-in"
    expect(page.get_by_role("button", name="Continue with Google")).to_be_visible()


# --- US-dashboard-home-1: Signed-in User sees their dashboard ------------------------------------------------


def test_US_dashboard_home_1_1_signed_in_user_sees_greeting(auth_configured, seed, browser_with):
    """US-dashboard-home-1.1 (happy, session: user): "Sam Tester" opens /dashboard: 200, h1 "Hi, Sam", Sign out visible."""
    sam = seed(name="Sam Tester")
    page, resp = _open_dashboard(browser_with(sam), "1_1_dashboard_sam")
    assert resp is not None and resp.status == 200
    assert urlparse(page.url).path == "/dashboard"
    expect(page.get_by_role("heading", level=1)).to_have_text("Hi, Sam")
    if not SIGN_OUT_DELIVERED:
        pytest.skip(f"status and greeting passed; Sign out button not checked. {SIGN_OUT_PENDING}")
    expect(page.get_by_role("button", name="Sign out")).to_be_visible()


def test_US_dashboard_home_1_2_dashboard_is_no_store_and_noindex(auth_configured, seed, browser_with):
    """US-dashboard-home-1.2 (security, session: user): the response is Cache-Control no-store and the HTML is robots noindex."""
    sam = seed(name="Sam Tester")
    page, resp = _open_dashboard(browser_with(sam), "1_2_dashboard_headers")
    assert resp is not None and resp.status == 200
    assert "no-store" in (resp.header_value("cache-control") or "")
    robots = page.locator('meta[name="robots"]')
    expect(robots).to_have_count(1)
    assert "noindex" in (robots.get_attribute("content") or "")


def test_US_dashboard_home_1_3_no_data_about_another_user(auth_configured, seed, browser_with):
    """US-dashboard-home-1.3 (security, session: user): with Users Sam and Alex, Sam's dashboard shows nothing about Alex."""
    sam = seed(name="Sam Tester")
    alex = seed(name=f"Alex Other{uuid.uuid4().hex[:8]}")
    page, resp = _open_dashboard(browser_with(sam), "1_3_dashboard_sam_not_alex")
    assert resp is not None and resp.status == 200
    expect(page.get_by_role("heading", level=1)).to_have_text("Hi, Sam")
    for html in (resp.text(), page.content()):
        for value in ("Alex", alex["name"], alex["email"], alex["user_id"], alex["token"]):
            assert value not in html, f"Alex's data appears on Sam's dashboard: {value!r}"


def test_US_dashboard_home_1_4_no_name_falls_back_to_hi_there(auth_configured, seed, browser_with):
    """US-dashboard-home-1.4 (edge, session: user): a User whose Google profile has no name sees "Hi there"."""
    nameless = seed(name="")
    page, resp = _open_dashboard(browser_with(nameless), "1_4_dashboard_no_name")
    assert resp is not None and resp.status == 200
    expect(page.get_by_role("heading", level=1)).to_have_text("Hi there")


def test_T01_V1_loader_exposes_only_the_first_name(auth_configured, seed, browser_with):
    """Task 01 Verification (security, session: user): the page carries the first name only, never the email,
    full name, User id or session token (the loader returns { firstName })."""
    sam = seed(name=f"Sam Tester{uuid.uuid4().hex[:8]}")
    page, resp = _open_dashboard(browser_with(sam), "T01_V1_dashboard_fields")
    assert resp is not None and resp.status == 200
    expect(page.get_by_role("heading", level=1)).to_have_text("Hi, Sam")
    for html in (resp.text(), page.content()):
        for value in (sam["email"], sam["name"], sam["user_id"], sam["token"]):
            assert value not in html, f"dashboard output leaks {value!r}"


# --- US-dashboard-home-2: Anonymous visitors are sent to the Login page --------------------------------------


def test_US_dashboard_home_2_1_anonymous_visitor_is_redirected(pw, ctx):
    """US-dashboard-home-2.1 (security, session: public): a fresh browser opening /dashboard is redirected to
    /sign-in, and the server-rendered response holds no dashboard content."""
    req = pw.request.new_context()
    try:
        r = req.get(f"{BASE}/dashboard", max_redirects=0)
        assert 300 <= r.status < 400, f"expected a redirect, got {r.status}"
        assert urlparse(r.headers.get("location", "")).path == "/sign-in"
        assert "no-store" in r.headers.get("cache-control", "")
        body = r.text()
        for marker in ("Hi, ", "Hi there", "Dashboard", "Sign out"):
            assert marker not in body, f"redirect body contains dashboard content: {marker!r}"
    finally:
        req.dispose()

    page = ctx.new_page()
    page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    _shot(page, "2_1_anonymous_redirect")
    _assert_on_sign_in(page)
    expect(page.get_by_role("heading", name="Hi", exact=False)).to_have_count(0)


@pytest.mark.parametrize("kind", ["forged", "expired"])
def test_US_dashboard_home_2_2_forged_or_expired_cookie_is_redirected(auth_configured, seed, browser_with, kind):
    """US-dashboard-home-2.2 (failure, session: public): a forged or expired session cookie is redirected to /sign-in."""
    if kind == "forged":
        cookie = {"cookie_name": COOKIE_NAME, "cookie_value": sign_cookie_value("forged-token", "not-the-server-secret")}
    else:
        cookie = seed(name="Sam Tester", lifetime_days=-1)
    page, _ = _open_dashboard(browser_with(cookie), f"2_2_{kind}_cookie_redirect")
    _assert_on_sign_in(page)
    expect(page.get_by_role("heading", name="Hi", exact=False)).to_have_count(0)


# --- US-dashboard-home-3: Sign out ---------------------------------------------------------------------------


def _sign_out(page):
    page.get_by_role("button", name="Sign out").click()
    page.wait_for_url(f"{BASE}/", wait_until="networkidle")


@needs_sign_out
def test_US_dashboard_home_3_1_sign_out_ends_session(pw, auth_configured, seed, browser_with):
    """US-dashboard-home-3.1 (happy, session: user): clicking Sign out lands on /, removes the session cookie
    and ends the session on the server."""
    sam = seed(name="Sam Tester")
    context = browser_with(sam)
    page, _ = _open_dashboard(context, "3_1_before_sign_out")
    expect(page.get_by_role("heading", level=1)).to_have_text("Hi, Sam")
    _sign_out(page)
    _shot(page, "3_1_after_sign_out")
    assert urlparse(page.url).path == "/"
    assert [c for c in context.cookies() if c["name"] == sam["cookie_name"]] == []
    assert _get_session(pw, sam["cookie_name"], sam["cookie_value"]) is None


@needs_sign_out
@pytest.mark.parametrize("how", ["back", "open"])
def test_US_dashboard_home_3_2_after_sign_out_dashboard_redirects(auth_configured, seed, browser_with, how):
    """US-dashboard-home-3.2 (security, session: user): after signing out, Back or opening /dashboard goes to /sign-in."""
    sam = seed(name="Sam Tester")
    page, _ = _open_dashboard(browser_with(sam), f"3_2_before_sign_out_{how}")
    _sign_out(page)
    if how == "back":
        page.go_back(wait_until="networkidle")
    else:
        page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    _shot(page, f"3_2_after_sign_out_{how}")
    _assert_on_sign_in(page)


@needs_sign_out
def test_US_dashboard_home_3_3_sign_out_ends_only_current_session(pw, auth_configured, seed, browser_with):
    """US-dashboard-home-3.3 (edge, session: user): signed in on two browsers, signing out in one leaves the other signed in."""
    sam = seed(name="Sam Tester")
    try:
        second = add_seeded_session(sam, BASE)
    except SeedRefused as e:
        pytest.skip(f"BLOCKED: {e}")
    first_page, _ = _open_dashboard(browser_with(sam), "3_3_browser_one")
    second_page, _ = _open_dashboard(browser_with(second), "3_3_browser_two")
    _sign_out(first_page)
    second_page.reload(wait_until="networkidle")
    _shot(second_page, "3_3_browser_two_after_other_sign_out")
    assert urlparse(second_page.url).path == "/dashboard"
    expect(second_page.get_by_role("heading", level=1)).to_have_text("Hi, Sam")
    assert _get_session(pw, second["cookie_name"], second["cookie_value"]) is not None
    assert _get_session(pw, sam["cookie_name"], sam["cookie_value"]) is None
