"""US-google-sign-in-2 and 4 as wired by task 07 (docs/tasks/google-sign-in/07-wire-google-button-and-states.md).

One test per scenario: 2.1 to 2.4 (start sign-in), 4.1 to 4.4 (failure messages). Scenarios that need real
Google (2.1 live consent, 4.1 Cancel at Google) are covered up to our own boundary: the Google request is
intercepted and never sent, and the ?error=access_denied redirect-back is requested directly. Cases that need
a configured auth server skip as BLOCKED when the one-time probe in `auth_probe` does not return a Google URL. Never type real Google credentials.
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


@pytest.fixture(scope="module")
def auth_probe(pw):
    """Probe once per module: POST a valid sign-in request (one OAuth state row on a configured server).

    Returns the response when auth is configured (2xx with a Google URL); otherwise skips as BLOCKED.
    """
    req = pw.request.new_context()
    try:
        r = req.post(
            f"{BASE}/api/auth/sign-in/social",
            data={"provider": "google", "callbackURL": "/dashboard", "errorCallbackURL": "/sign-in"},
            headers={"origin": SITE_URL},
        )
        status, text = r.status, r.text()
    finally:
        req.dispose()
    if not (200 <= status < 300 and "accounts.google.com" in text):
        pytest.skip(f"BLOCKED: server has no working Google auth config (probe answered {status})")
    return status


def _stub_google(page):
    """Never reach real Google: answer any accounts.google.com request with a stub page."""
    page.route(
        re.compile(r"https://accounts\.google\.com/.*"),
        lambda route: route.fulfill(status=200, content_type="text/html", body="<h1>Stub Google</h1>"),
    )


def test_US_google_sign_in_2_1_redirect_to_google(page, auth_probe):
    """US-google-sign-in-2.1 (story US-google-sign-in-2): click goes to accounts.google.com with the right OAuth params."""
    _open(page)
    _stub_google(page)
    _button(page).click()
    page.wait_for_url(re.compile(r"https://accounts\.google\.com/.*"))
    q = parse_qs(urlparse(page.url).query)
    assert q["client_id"][0]
    assert q["redirect_uri"][0] == f"{SITE_URL}/api/auth/callback/google"
    assert set(q["scope"][0].replace("+", " ").split()) == {"openid", "email", "profile"}
    assert q["state"][0]
    _shot(page, "US-google-sign-in-2.1_google_redirect")


def test_US_google_sign_in_2_2_loading_state(page):
    """US-google-sign-in-2.2 (story US-google-sign-in-2): while Google has not loaded, the button shows the loading state."""
    page.route(SOCIAL, lambda route: None)  # hold the request open: Google has not answered yet
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
    _shot(page, "US-google-sign-in-2.3_double_click")


def test_US_google_sign_in_2_4_open_redirect_blocked(page, auth_probe):
    """US-google-sign-in-2.4 (story US-google-sign-in-2, security): an external callbackURL is rejected."""
    # auth_probe proved a same-origin request with a good callbackURL succeeds, so a 4xx here is the callbackURL check.
    r = page.request.post(
        f"{BASE}/api/auth/sign-in/social",
        data={"provider": "google", "callbackURL": "https://evil.example/"},
        headers={"origin": SITE_URL},
    )
    assert 400 <= r.status < 500, r.status
    assert "accounts.google.com" not in r.text()
    _shot(page, "US-google-sign-in-2.4_open_redirect_blocked")


def test_US_google_sign_in_4_1_cancelled_at_google(page):
    """US-google-sign-in-4.1 (story US-google-sign-in-4): ?error=access_denied shows the cancel message, button enabled, no session cookie."""
    _open(page, "?error=access_denied")
    assert urlparse(page.url).path == "/sign-in"
    expect(_status(page)).to_have_text(CANCEL)
    expect(_button(page)).to_be_enabled()
    # Guards against a regression where GET /sign-in sets cookies; also meaningful after a real Google cancel.
    assert not any("session" in c["name"] for c in page.context.cookies())
    _shot(page, "US-google-sign-in-4.1_cancelled")


def test_US_google_sign_in_4_2_tampered_callback(page, auth_probe):
    """US-google-sign-in-4.2 (story US-google-sign-in-4, security): an invalid state ends on /sign-in with the generic message and no session."""
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
    # on any server.
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


def test_task07_back_forward_cache_restore_resets_button(page):
    """Task 07 Verification (bfcache): a persisted pageshow returns the button to idle.

    Simplification: this fires a synthetic pageshow with persisted=true, so it proves the handler is wired,
    not a real back/forward cache restore (Playwright cannot force bfcache reliably in headless Chromium).
    """
    page.route(SOCIAL, lambda route: None)
    _open(page)
    _button(page).click()
    expect(_button(page, "Opening Google…")).to_be_disabled()
    page.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))")
    expect(_button(page)).to_be_enabled()
    expect(_button(page)).not_to_have_attribute("aria-busy", "true")
    expect(_status(page)).to_have_text("")
    _shot(page, "task07_bfcache_restore")
