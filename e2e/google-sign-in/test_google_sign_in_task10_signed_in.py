"""US-google-sign-in-3 (3.3, 3.4), 5.1 and 6 as delivered by task 10
(docs/tasks/google-sign-in/10-e2e-google-sign-in.md).

Signed-in state is seeded into your own Neon developer branch and the signed cookie is set in the browser
(ADR 0009, helpers.seed_signed_in_session).
Needs: E2E_BASE_URL (local, default http://localhost:3000), E2E_SEED_DATABASE_URL (your own Neon developer branch,
with E2E_SEED_NEON_ENDPOINT=<its ep-... id>; the server speaks Neon HTTP, so a plain local Postgres needs a
Neon HTTP proxy) and E2E_BETTER_AUTH_SECRET (or BETTER_AUTH_SECRET) equal to the server's secret.
Without them the seeded scenarios skip as BLOCKED. Never point this at dev or production.
Scenarios 3.1 and 3.2 are manual on dev (real Google) and skipped here.
Run with Node 24 (T02_V1b and T03_V3 shell out to `pnpm test`).
    E2E_BASE_URL=http://localhost:3000 pytest e2e/google-sign-in/test_google_sign_in_task10_signed_in.py -rs
Screenshots go to e2e/google-sign-in/screenshots (git-ignored).
"""
import json
import os
import pathlib
import uuid
from urllib.parse import urlparse

import pytest
from playwright.sync_api import Error as PlaywrightError, expect

from helpers import SeedRefused, delete_seeded_user, seed_signed_in_session, sign_cookie_value

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")
SHOTS = pathlib.Path(__file__).parent / "screenshots"


def _shot(page, name):
    SHOTS.mkdir(exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{name}.png"))


def _seed(lifetime_days=7):
    try:
        # a unique name per run makes the name check in 6.2 meaningful
        return seed_signed_in_session(BASE, name=f"Sam Tester {uuid.uuid4().hex[:8]}", lifetime_days=lifetime_days)
    except SeedRefused as e:
        pytest.skip(f"BLOCKED: {e}")


@pytest.fixture
def seeded():
    s = _seed()
    yield s
    delete_seeded_user(s["user_id"], BASE)


@pytest.fixture
def seeded_stale():
    """A session old enough that Better Auth refreshes it (and so re-sets the cookie) on the next getSession.

    Assumes Better Auth's defaults: expiresIn 7 days and updateAge 1 day, so a session created 5 days ago
    (2 days left) is past the refresh point. If session settings are ever added to buildAuthOptions
    (src/server/auth/auth.ts), update lifetime_days here or 3.3 and 3.4 fail with "not refreshed"."""
    s = _seed(lifetime_days=5)
    yield s
    delete_seeded_user(s["user_id"], BASE)


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


def _inject_cookie(name, value):
    def handler(route):
        route.continue_(headers={**route.request.headers, "cookie": f"{name}={value}"})

    return handler


def test_T10_V2_seeded_cookie_is_accepted_by_get_session(pw, auth_configured, seeded):
    """Task 10 Verification (guards the cookie-format coupling).

    The seeded signed cookie yields this User's session; a cookie signed with another secret does not.
    Calls the Better Auth /api/auth/get-session endpoint, not the app helper getSession in
    src/server/auth/session.ts. Both go through auth.api.getSession with the request headers, so this
    guards the same coupling; 5.1 exercises the app helper through the /dashboard redirect.
    """
    _, body = _get_session(pw, seeded["cookie_name"], seeded["cookie_value"])
    assert body is not None, "seeded cookie was not accepted: check E2E_BETTER_AUTH_SECRET matches the server"
    assert body["user"]["email"] == seeded["email"]
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
    # check_seed_allowed only permits a local server, so this runs over http and never sees Secure.
    # The Secure-on-https half of 3.3 is not covered here; this only asserts Secure is absent on http.
    assert ("secure" in attrs) == BASE.startswith("https://")


def test_US_google_sign_in_3_4_cookie_not_sent_to_subdomain(browser, auth_configured, seeded_stale):
    """US-google-sign-in-3.4 (security, session: user): the cookie the SERVER issues is host-only, so sam.localhost never receives it."""
    host = urlparse(BASE)
    if host.hostname != "localhost":
        pytest.skip("BLOCKED: the subdomain check needs the app on localhost (sam.localhost)")
    sub = f"{host.scheme}://sam.localhost" + (f":{host.port}" if host.port else "")
    name = seeded_stale["cookie_name"]
    ctx = browser.new_context()
    try:
        page = ctx.new_page()
        # The jar starts empty. The seeded cookie is sent by header on one request only,
        # so a stored cookie can only come from the server's Set-Cookie.
        page.route(f"{BASE}/api/auth/get-session", _inject_cookie(name, seeded_stale["cookie_value"]))
        page.goto(f"{BASE}/", wait_until="networkidle")
        # evaluate awaits the fetch, so the Set-Cookie is processed before we read the jar
        result = page.evaluate(
            "fetch('/api/auth/get-session', {credentials: 'include'})"
            ".then(async r => ({status: r.status, body: await r.text()}))"
        )
        assert result["status"] == 200 and result["body"] not in ("", "null"), (
            "Cookie header override was not applied: get-session returned no session"
        )
        page.unroute(f"{BASE}/api/auth/get-session")
        stored = [c for c in ctx.cookies() if c["name"] == name]
        assert stored, "the server did not set a session cookie for the stale seeded session"
        assert stored[0]["domain"] == "localhost", f"cookie is not host-only: domain={stored[0]['domain']!r}"
        seen = []
        page.on("request", lambda req: seen.append(req))
        page.goto(f"{BASE}/", wait_until="networkidle")
        app_req = [r for r in seen if r.url.rstrip("/") == BASE]
        assert app_req and name in app_req[0].all_headers().get("cookie", ""), "positive control: the cookie must reach localhost"
        seen.clear()
        try:
            page.goto(f"{sub}/", wait_until="load")
        except PlaywrightError:
            pass  # the app may refuse or not resolve the subdomain; the request headers are what matter
        sub_requests = [r for r in seen if urlparse(r.url).hostname == "sam.localhost"]
        assert sub_requests, "no request reached sam.localhost"
        for r in sub_requests:
            assert "cookie" not in {k.lower() for k in r.all_headers()}, f"cookie sent to subdomain: {r.url}"
    finally:
        ctx.close()


@pytest.mark.parametrize("entry", ["direct", "homepage_link"])
def test_US_google_sign_in_5_1_signed_in_user_is_redirected_to_dashboard(auth_configured, signed_in_ctx, entry):
    """US-google-sign-in-5.1 (happy, session: user): opening /sign-in (directly or from the
    homepage Sign in link) while signed in redirects to /dashboard (path only until the dashboard exists)."""
    page = signed_in_ctx.new_page()
    if entry == "direct":
        page.goto(f"{BASE}/sign-in", wait_until="networkidle")
    else:
        page.goto(f"{BASE}/", wait_until="networkidle")
        page.get_by_role("link", name="Sign in").first.click()
        page.wait_for_url("**/dashboard")
    _shot(page, f"task10_5_1_redirect_{entry}")
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


def test_US_google_sign_in_6_2_homepage_has_no_user_data_when_signed_in(auth_configured, signed_in_ctx, seeded):
    """US-google-sign-in-6.2 (security, session: user): the homepage HTML holds neither the User's email nor their name."""
    page = signed_in_ctx.new_page()
    resp = page.goto(f"{BASE}/", wait_until="networkidle")
    # the Given must hold: the server accepts the seeded cookie (else this is the anonymous page and proves nothing)
    session = page.evaluate(
        "fetch('/api/auth/get-session').then(async r => ({status: r.status, text: await r.text()}))"
    )
    body = json.loads(session["text"]) if session["status"] == 200 and session["text"] not in ("", "null") else None
    assert body and body["user"]["email"] == seeded["email"], "browser is not signed in"
    html = resp.text()
    _shot(page, "task10_6_2_homepage_signed_in")
    assert seeded["email"] not in html
    assert seeded["name"] not in html
    rendered = page.content()
    assert seeded["email"] not in rendered
    assert seeded["name"] not in rendered
