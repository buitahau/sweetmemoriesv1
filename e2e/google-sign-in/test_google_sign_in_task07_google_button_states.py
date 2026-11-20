"""US-google-sign-in-2 and 4 as wired by task 07 (docs/tasks/google-sign-in/07-wire-google-button-and-states.md).

One test per scenario: 2.1 to 2.4 (start sign-in), 4.1 to 4.4 (failure messages). Scenarios that need real
Google (2.1 live consent, 4.1 Cancel at Google) are covered up to our own boundary: the Google request is
intercepted and never sent, and the ?error=access_denied redirect-back is requested directly. Cases that need
a configured auth server skip as BLOCKED when /api/auth answers 5xx. Never type real Google credentials.
Run against a local or dev URL, never production:
    E2E_BASE_URL=http://localhost:3000 pytest e2e/google-sign-in/test_google_sign_in_task07_google_button_states.py -rs
Screenshots go to e2e/google-sign-in/screenshots (git-ignored).
"""
import json
import os
import pathlib
import re
from urllib.parse import parse_qs, urlparse

import pytest
from playwright.sync_api import expect

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")
SHOTS = pathlib.Path(__file__).parent / "screenshots"
SITE_URL = os.environ.get("E2E_SITE_URL", BASE).rstrip("/")  # the server's SITE_URL, if it differs from BASE
SOCIAL = "**/api/auth/sign-in/social"
CANCEL = "Sign-in was cancelled. You can try again."
GENERIC = "Something went wrong signing you in. Please try again."
LOADING_TEXT = "Taking you to Google to choose your account."


@pytest.fixture(scope="module")
def browser(pw):
    b = pw.chromium.launch()
    yield b
    b.close()


@pytest.fixture
def page(browser):
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    yield ctx.new_page()
    ctx.close()


def _shot(page, name):
    SHOTS.mkdir(exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{name}.png"))


def _open(page, query=""):
    page.goto(f"{BASE}/sign-in{query}", wait_until="networkidle")


def _button(page, name="Continue with Google"):
    return page.get_by_role("button", name=name)


def _status(page):
    return page.get_by_role("status")


def _auth_configured(page):
    """POST a harmless valid request; 5xx (503 no SITE_URL, 500 no Google/DB secrets) means auth is not configured (BLOCKED)."""
    r = page.request.post(
        f"{BASE}/api/auth/sign-in/social",
        data={"provider": "google", "callbackURL": "/dashboard", "errorCallbackURL": "/sign-in"},
        headers={"origin": BASE},
    )
    return r.status < 500, r


def _stub_google(page):
    """Never reach real Google: answer any accounts.google.com request with a stub page."""
    page.route(
        re.compile(r"https://accounts\.google\.com/.*"),
        lambda route: route.fulfill(status=200, content_type="text/html", body="<h1>Stub Google</h1>"),
    )


def test_US_google_sign_in_2_1_redirect_to_google(page):
    """US-google-sign-in-2.1 (story US-google-sign-in-2): click goes to accounts.google.com with the right OAuth params."""
    _open(page)
    ok, _ = _auth_configured(page)
    if not ok:
        pytest.skip("BLOCKED: server has no Google auth config (/api/auth answers 5xx)")
    _stub_google(page)
    _button(page).click()
    page.wait_for_url(re.compile(r"https://accounts\.google\.com/.*"))
    q = parse_qs(urlparse(page.url).query)
    assert q["client_id"][0]
    assert q["redirect_uri"][0] == f"{SITE_URL}/api/auth/callback/google"
    assert set(q["scope"][0].replace("+", " ").split()) == {"openid", "email", "profile"}
    assert q["state"][0]


def test_US_google_sign_in_2_2_loading_state(page):
    """US-google-sign-in-2.2 (story US-google-sign-in-2): while Google has not loaded, the button shows the loading state."""
    release = {}

    def slow(route):
        release["route"] = route  # hold the request open: Google has not answered yet

    page.route(SOCIAL, slow)
    _open(page)
    _button(page).click()
    busy = _button(page, "Opening Google…")
    expect(busy).to_be_visible()
    expect(busy).to_have_attribute("aria-busy", "true")
    expect(busy).to_be_disabled()
    expect(_status(page)).to_have_text(LOADING_TEXT)
    _shot(page, "US-google-sign-in-2.2_loading")


def test_US_google_sign_in_2_3_double_click_sends_one_request(page):
    """US-google-sign-in-2.3 (story US-google-sign-in-2): a quick double click sends one sign-in request."""
    calls = []

    def hold(route):
        calls.append(route.request.url)  # never answered, so the button stays in loading

    page.route(SOCIAL, hold)
    _open(page)
    _button(page).dblclick()
    expect(_button(page, "Opening Google…")).to_be_disabled()
    page.wait_for_timeout(500)
    assert len(calls) == 1, calls


def test_US_google_sign_in_2_4_open_redirect_blocked(page):
    """US-google-sign-in-2.4 (story US-google-sign-in-2, security): an external callbackURL is rejected."""
    ok, _ = _auth_configured(page)
    if not ok:
        pytest.skip("BLOCKED: server has no Google auth config (/api/auth answers 5xx)")
    r = page.request.post(
        f"{BASE}/api/auth/sign-in/social",
        data={"provider": "google", "callbackURL": "https://evil.example/"},
        headers={"origin": BASE},
    )
    assert 400 <= r.status < 500
    assert "accounts.google.com" not in r.text()


def test_US_google_sign_in_4_1_cancelled_at_google(page):
    """US-google-sign-in-4.1 (story US-google-sign-in-4): ?error=access_denied shows the cancel message, button enabled, no session cookie."""
    _open(page, "?error=access_denied")
    assert urlparse(page.url).path == "/sign-in"
    expect(_status(page)).to_have_text(CANCEL)
    expect(_button(page)).to_be_enabled()
    assert not any("session" in c["name"] for c in page.context.cookies())
    _shot(page, "US-google-sign-in-4.1_cancelled")


def test_US_google_sign_in_4_2_tampered_callback(page):
    """US-google-sign-in-4.2 (story US-google-sign-in-4, security): an invalid state ends on /sign-in with the generic message and no session."""
    ok, _ = _auth_configured(page)
    if not ok:
        pytest.skip("BLOCKED: server has no Google auth config (/api/auth answers 5xx)")
    page.goto(
        f"{BASE}/api/auth/callback/google?code=fake&state=tampered",
        wait_until="networkidle",
    )
    assert urlparse(page.url).path == "/sign-in"
    expect(_status(page)).to_have_text(GENERIC)
    assert not any("session" in c["name"] for c in page.context.cookies())
    _shot(page, "US-google-sign-in-4.2_tampered")


def test_US_google_sign_in_4_3_unknown_error_code_not_reflected(page):
    """US-google-sign-in-4.3 (story US-google-sign-in-4, security): unknown ?error= shows the generic message and no raw text."""
    _open(page, "?error=%3Cscript%3Ealert(1)%3C%2Fscript%3E")
    expect(_status(page)).to_have_text(GENERIC)
    html = page.content()
    assert "alert(1)" not in html
    assert "<script>alert" not in html
    _open(page, "?error=weird_code_xyz")
    expect(_status(page)).to_have_text(GENERIC)
    assert "weird_code_xyz" not in page.locator("body").inner_text()
    _shot(page, "US-google-sign-in-4.3_unknown")


def test_US_google_sign_in_4_4_auth_misconfigured_returns_to_idle(page):
    """US-google-sign-in-4.4 (story US-google-sign-in-4, failure): a failing sign-in request restores idle with the generic message and no leaks."""
    # The server answer for a missing Google client ID is simulated at the network layer so the case runs
    # on any server; the real 503 body is asserted too when the server happens to be unconfigured.
    secret_body = json.dumps({"error": "boom", "stack": "at secret.ts:1", "GOOGLE_CLIENT_SECRET": "s3cr3t"})
    page.route(SOCIAL, lambda route: route.fulfill(status=503, content_type="application/json", body=secret_body))
    _open(page)
    _button(page).click()
    expect(_status(page)).to_have_text(GENERIC)
    expect(_button(page)).to_be_enabled()
    expect(_button(page)).not_to_have_attribute("aria-busy", "true")
    body = page.locator("body").inner_text()
    assert "s3cr3t" not in body and "secret.ts" not in body
    _shot(page, "US-google-sign-in-4.4_misconfigured")
    page.unroute(SOCIAL)
    ok, resp = _auth_configured(page)
    if not ok:
        assert "stack" not in resp.text().lower() and "secret" not in resp.text().lower()


def test_task07_back_forward_cache_restore_resets_button(page):
    """Task 07 Verification (bfcache): a persisted pageshow returns the button to idle."""
    page.route(SOCIAL, lambda route: None)
    _open(page)
    _button(page).click()
    expect(_button(page, "Opening Google…")).to_be_disabled()
    page.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))")
    expect(_button(page)).to_be_enabled()
    expect(_button(page)).not_to_have_attribute("aria-busy", "true")
    expect(_status(page)).to_have_text("")
