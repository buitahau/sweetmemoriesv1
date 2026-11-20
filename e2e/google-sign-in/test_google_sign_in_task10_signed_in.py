"""US-google-sign-in-3 (3.3, 3.4), 5.1 and 6 as delivered by task 10 (docs/tasks/google-sign-in/10-e2e-google-sign-in.md).

Signed-in state is seeded into a LOCAL test database and the signed cookie is set in the browser (ADR 0009, helpers.seed_signed_in_session).
Needs: E2E_BASE_URL (local, default http://localhost:3000), E2E_SEED_DATABASE_URL (a local Postgres, or your own Neon developer
branch with E2E_ALLOW_NEON_BRANCH=1) and E2E_BETTER_AUTH_SECRET (or BETTER_AUTH_SECRET) equal to the server's secret. Without them the
seeded scenarios skip as BLOCKED. Never point this at dev or production. Scenarios 3.1 and 3.2 are manual on dev (real Google) and skipped here.
    E2E_BASE_URL=http://localhost:3000 pytest e2e/google-sign-in/test_google_sign_in_task10_signed_in.py -rs
Screenshots go to e2e/google-sign-in/screenshots (git-ignored).
"""
import os
import pathlib
from urllib.parse import urlparse

import pytest
from playwright.sync_api import expect

from helpers import SeedRefused, delete_seeded_user, seed_signed_in_session

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")
SHOTS = pathlib.Path(__file__).parent / "screenshots"


def _shot(page, name):
    SHOTS.mkdir(exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{name}.png"))


def _seed(lifetime_days=7):
    try:
        return seed_signed_in_session(BASE, lifetime_days=lifetime_days)
    except SeedRefused as e:
        pytest.skip(f"BLOCKED: {e}")


@pytest.fixture
def seeded():
    s = _seed()
    yield s
    delete_seeded_user(s["user_id"])


@pytest.fixture
def seeded_stale():
    """A session old enough that Better Auth refreshes it (and so re-sets the cookie) on the next getSession."""
    s = _seed(lifetime_days=5)
    yield s
    delete_seeded_user(s["user_id"])


@pytest.fixture
def signed_in_ctx(browser, seeded):
    c = browser.new_context(viewport={"width": 1440, "height": 900})
    c.add_cookies([{"name": seeded["cookie_name"], "value": seeded["cookie_value"], "url": BASE}])
    yield c
    c.close()


@pytest.fixture(scope="module")
def auth_configured(pw):
    req = pw.request.new_context()
    try:
        status = req.get(f"{BASE}/api/auth/get-session").status
    finally:
        req.dispose()
    if status != 200:
        pytest.skip(f"BLOCKED: server has no auth config (/api/auth/get-session answered {status})")


def _get_session(pw, cookie_name, cookie_value):
    req = pw.request.new_context(extra_http_headers={"cookie": f"{cookie_name}={cookie_value}"})
    try:
        r = req.get(f"{BASE}/api/auth/get-session")
        return r, (r.json() if r.status == 200 and r.text() not in ("", "null") else None)
    finally:
        req.dispose()


@pytest.mark.skip(reason="manual on dev (real Google account, ADR 0009): first sign-in creates exactly one User and lands on /dashboard")
def test_US_google_sign_in_3_1_first_sign_in_manual():
    """US-google-sign-in-3.1: BLOCKED/manual, recorded in the feature delivery notes."""


@pytest.mark.skip(reason="manual on dev (real Google account, ADR 0009): returning User lands on /dashboard, no second User")
def test_US_google_sign_in_3_2_returning_user_manual():
    """US-google-sign-in-3.2: BLOCKED/manual, recorded in the feature delivery notes."""


def test_T10_V2_seeded_cookie_is_accepted_by_get_session(pw, auth_configured, seeded):
    """Task 10 Verification (guards the cookie-format coupling): the seeded signed cookie yields this User's session; a cookie signed with another secret does not."""
    _, body = _get_session(pw, seeded["cookie_name"], seeded["cookie_value"])
    assert body is not None, "seeded cookie was not accepted: check E2E_BETTER_AUTH_SECRET matches the server"
    assert body["user"]["email"] == seeded["email"]
    from helpers import sign_cookie_value

    _, forged = _get_session(pw, seeded["cookie_name"], sign_cookie_value(seeded["token"], "not-the-server-secret"))
    assert forged is None


def test_US_google_sign_in_3_3_session_cookie_attributes(pw, auth_configured, seeded_stale):
    """US-google-sign-in-3.3 (security, session: user): the cookie the server sets is HttpOnly, SameSite=Lax, host-only, Secure on https."""
    r, body = _get_session(pw, seeded_stale["cookie_name"], seeded_stale["cookie_value"])
    assert body is not None, "seeded cookie was not accepted"
    set_cookies = [h["value"] for h in r.headers_array if h["name"].lower() == "set-cookie"]
    session = [c for c in set_cookies if c.startswith(seeded_stale["cookie_name"] + "=")]
    assert session, "the stale seeded session was not refreshed, so no session cookie was set to inspect"
    attrs = [a.strip().lower() for a in session[0].split(";")[1:]]
    assert "httponly" in attrs
    assert "samesite=lax" in attrs
    assert not any(a.startswith("domain") for a in attrs), f"cookie must be host-only: {session[0].split(';')[1:]}"
    assert ("secure" in attrs) == BASE.startswith("https://")


def test_US_google_sign_in_3_4_cookie_not_sent_to_subdomain(signed_in_ctx):
    """US-google-sign-in-3.4 (security, session: user): a signed-in browser's request to sam.localhost carries no session cookie."""
    host = urlparse(BASE)
    if host.hostname != "localhost":
        pytest.skip("BLOCKED: the subdomain check needs the app on localhost (sam.localhost)")
    sub = f"{host.scheme}://sam.localhost" + (f":{host.port}" if host.port else "")
    seen = []
    page = signed_in_ctx.new_page()
    page.on("request", lambda req: seen.append(req))
    page.goto(f"{BASE}/", wait_until="networkidle")  # the cookie is in the jar for the app host
    seen.clear()
    try:
        page.goto(f"{sub}/", wait_until="load")
    except Exception:
        pass  # the app may refuse or not resolve the subdomain; the request headers are what matter
    sub_requests = [r for r in seen if urlparse(r.url).hostname == "sam.localhost"]
    assert sub_requests, "no request reached sam.localhost"
    for r in sub_requests:
        assert "cookie" not in {k.lower() for k in r.all_headers()}, f"cookie sent to subdomain: {r.url}"


def test_US_google_sign_in_5_1_signed_in_user_is_redirected_to_dashboard(signed_in_ctx):
    """US-google-sign-in-5.1 (happy, session: user): opening /sign-in while signed in redirects to /dashboard (path only until the dashboard exists)."""
    page = signed_in_ctx.new_page()
    page.goto(f"{BASE}/sign-in", wait_until="networkidle")
    _shot(page, "task10_5_1_redirect")
    assert urlparse(page.url).path == "/dashboard"
    expect(page.get_by_role("button", name="Continue with Google")).to_have_count(0)


@pytest.mark.parametrize("path", ["/", "/sign-in", "/api/health"])
def test_US_google_sign_in_6_1_public_routes_set_no_cookie(pw, path):
    """US-google-sign-in-6.1 (security, session: public): a fresh client gets no Set-Cookie from /, /sign-in and /api/health."""
    req = pw.request.new_context()
    try:
        r = req.get(f"{BASE}{path}")
        assert r.status == 200
        names = [h["name"].lower() for h in r.headers_array]
        assert "set-cookie" not in names
    finally:
        req.dispose()


def test_US_google_sign_in_6_2_homepage_has_no_user_data_when_signed_in(signed_in_ctx, seeded):
    """US-google-sign-in-6.2 (security, session: user): the homepage HTML holds neither the User's email nor their name."""
    page = signed_in_ctx.new_page()
    resp = page.goto(f"{BASE}/", wait_until="networkidle")
    html = resp.text()
    _shot(page, "task10_6_2_homepage_signed_in")
    assert seeded["email"] not in html
    assert seeded["name"] not in html
    assert seeded["email"] not in page.content()
