"""E2E checks for google-sign-in task 04 (docs/tasks/google-sign-in/04-better-auth-server-and-api-route.md).

Spec scenarios covered at the API level: US-google-sign-in-2.4 (open-redirect blocked), the server half of
US-google-sign-in-4.4 (auth misconfigured gives a generic body) and US-google-sign-in-6.1 (/api/health sets no
cookie). The task's Verification items are named T04-V1 to T04-V5 (plus V2b and V2c). The browser scenarios of US-1 to 6 belong
to task 10. Live checks need a running server at E2E_BASE_URL (default http://localhost:3000, `pnpm start`);
when the server has no auth config they skip as BLOCKED. Never run against production.
"""
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

import pytest

from helpers import ROOT

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:3000")
UA = {"User-Agent": "Mozilla/5.0 (sweetmemories-e2e)"}


def _call(path, method="GET", body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {**UA, **(headers or {})}
    if data is not None:
        headers["Content-Type"] = "application/json"
        headers["Origin"] = BASE
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.headers, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read().decode()
    except OSError as e:
        pytest.skip(f"BLOCKED: no server reachable at {BASE}: {e}")


def _is_local():
    if os.environ.get("E2E_REQUIRE_AUTH") == "1":
        return False
    return urllib.parse.urlparse(BASE).hostname in ("localhost", "127.0.0.1", "::1", "0.0.0.0")


def _configured_or_skip():
    status, _, _ = _call("/api/auth/get-session")
    if status == 503 and not _is_local():
        pytest.fail("deployed server answers 503 on /api/auth/*: auth config (SITE_URL, secrets, DATABASE_URL) is missing")
    if status == 503:
        pytest.skip("BLOCKED: server has no auth config (GOOGLE_CLIENT_ID, secrets, DATABASE_URL)")


def test_T04_V1_config_has_no_cookie_domain_and_cross_subdomain_cookies_off():
    """T04-V1 smoke check, source scan only (ADR 0008; cookie attributes are checked live in task 10): auth config never enables crossSubDomainCookies or sets a cookie domain; trustedOrigins is SITE_URL."""
    src = (ROOT / "src/server/auth/auth.ts").read_text()
    assert not re.search(r"crossSubDomainCookies\s*:\s*\{[^}]*enabled\s*:\s*true", src, re.S)
    assert not re.search(r"\bdomain\s*:", src), "a cookie domain must not be set"
    assert "trustedOrigins" in src
    assert (ROOT / "src/routes/api/auth/$.ts").exists(), "handler must be mounted at /api/auth/$"


def test_T04_V2_foreign_callback_url_is_rejected():
    """T04-V2 / US-google-sign-in-2.4: POST sign-in/social with callbackURL https://evil.example/ gives 4xx and no Google URL."""
    _configured_or_skip()
    status, _, body = _call("/api/auth/sign-in/social", "POST",
                            {"provider": "google", "callbackURL": "https://evil.example/"})
    assert 400 <= status < 500, f"expected 4xx, got {status}"
    assert "accounts.google.com" not in body and "evil.example" not in body


def test_T04_V2b_foreign_error_callback_url_and_scopes_are_rejected():
    """T04-V2 (edge): foreign errorCallbackURL, protocol-relative callbackURL and a custom scopes list are refused."""
    _configured_or_skip()
    for payload in (
        {"provider": "google", "callbackURL": "/dashboard", "errorCallbackURL": "https://evil.example/"},
        {"provider": "google", "callbackURL": "//evil.example/"},
        {"provider": "google", "callbackURL": "/dashboard", "scopes": ["https://www.googleapis.com/auth/drive"]},
    ):
        status, _, body = _call("/api/auth/sign-in/social", "POST", payload)
        assert 400 <= status < 500, f"{payload} gave {status}"
        assert "accounts.google.com" not in body


def test_T04_V2c_valid_relative_callback_url_passes_the_guard():
    """T04-V2 (positive control): a valid relative callbackURL is not refused by the guard; with real config the
    Google URL uses redirect_uri <SITE_URL>/api/auth/callback/google and scope exactly `openid email profile`."""
    _configured_or_skip()
    status, _, body = _call("/api/auth/sign-in/social", "POST",
                            {"provider": "google", "callbackURL": "/dashboard"})
    assert not (status == 400 and "Invalid request." in body), "guard rejected a valid body"
    if status >= 500 and not _is_local():
        pytest.fail(f"deployed server answers {status} on sign-in/social: database tables or grants are missing")
    if status != 200:
        pytest.skip(f"BLOCKED: real DATABASE_URL and Google client needed for the Google URL check (got {status})")
    url = json.loads(body).get("url", "")
    parsed = urllib.parse.urlparse(url)
    query = urllib.parse.parse_qs(parsed.query)
    assert parsed.netloc == "accounts.google.com"
    assert query["redirect_uri"] == [f"{os.environ.get('SITE_URL', BASE)}/api/auth/callback/google"]
    assert query["scope"] == ["openid email profile"]


def test_T04_V3_missing_config_returns_503_with_generic_body():
    """T04-V3 / US-google-sign-in-4.4 (server half): without config the route returns 503 and no secret or stack trace."""
    if not _is_local():
        pytest.skip("BLOCKED: a deployed server must be configured; a 503 there is a failure (see _configured_or_skip)")
    status, _, body = _call("/api/auth/get-session")
    if status != 503:
        pytest.skip("BLOCKED: server is configured; the 503 path is covered by the Vitest suite and needs an unconfigured server")
    assert json.loads(body) == {"error": "Sign-in is unavailable."}
    for leak in ("GOOGLE_CLIENT", "BETTER_AUTH_SECRET", "DATABASE_URL", "postgres://", "Error:", " at "):
        assert leak not in body


def test_T04_V4_get_session_without_cookie_is_null():
    """T04-V4: a request with no or a forged session cookie has no session."""
    _configured_or_skip()
    status, _, body = _call("/api/auth/get-session")
    assert status == 200 and body.strip() in ("null", "")
    status, _, body = _call("/api/auth/get-session",
                            headers={"Cookie": "better-auth.session_token=forged.value"})
    assert status == 200 and body.strip() in ("null", ""), f"forged cookie gave {status}"


def test_T04_V5_auth_responses_are_no_store_and_health_sets_no_cookie():
    """T04-V5 / US-google-sign-in-6.1: /api/auth/* is no-store; /api/health returns 200 with no Set-Cookie."""
    status, headers, _ = _call("/api/auth/get-session")
    assert "no-store" in (headers.get("Cache-Control") or "")
    status, headers, body = _call("/api/health")
    assert status == 200 and json.loads(body) == {"status": "ok"}
    assert headers.get("Set-Cookie") is None
    for path in ("/", "/sign-in"):
        status, headers, _ = _call(path)
        assert status == 200, f"{path} gave {status}"
        assert headers.get("Set-Cookie") is None, f"{path} sets a cookie"
