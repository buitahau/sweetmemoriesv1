"""E2E tests for docs/features/project-skeleton.md (US-skeleton-1, US-skeleton-2).

One test per Given/When/Then scenario. All sessions are public (no cookies).
"""
import json
import socket

import pytest

from playwright.sync_api import Error as PlaywrightError, expect

HEADING = "SweetMemories home page"


# ---------- US-skeleton-1: Health check ----------

def test_US_skeleton_1_1_health_happy_path(api):
    """US-skeleton-1.1 (story US-skeleton-1): GET /api/health returns 200 JSON ok."""
    r = api.get("/api/health")
    assert r.status == 200
    assert r.headers["content-type"].split(";")[0].strip() == "application/json"
    assert r.text() == '{"status":"ok"}'


def test_US_skeleton_1_2_health_not_cached(api):
    """US-skeleton-1.2 (story US-skeleton-1): response is Cache-Control no-store."""
    r = api.get("/api/health")
    assert "no-store" in r.headers.get("cache-control", "")


def test_US_skeleton_1_3_health_sets_no_cookie(api):
    """US-skeleton-1.3 (story US-skeleton-1): no Set-Cookie header."""
    r = api.get("/api/health")
    assert "set-cookie" not in r.headers


def test_US_skeleton_1_4_health_exposes_no_internal_data(api):
    """US-skeleton-1.4 (story US-skeleton-1): body has only the status field."""
    r = api.get("/api/health")
    body = json.loads(r.text())
    assert list(body.keys()) == ["status"]
    text = r.text().lower()
    for leak in ("version", "stack", "hostname", "secret", "env", "node_modules"):
        assert leak not in text


def test_US_skeleton_1_5_health_wrong_method(api):
    """US-skeleton-1.5 (story US-skeleton-1): POST /api/health returns 405."""
    r = api.post("/api/health")
    assert r.status == 405
    assert '{"status":"ok"}' not in r.text()


def test_US_skeleton_1_6_health_server_down(pw):
    """US-skeleton-1.6 (story US-skeleton-1): nothing listening -> connect fails.

    Uses a free local port with no server, standing in for a stopped app server.
    """
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    req = pw.request.new_context(base_url=f"http://127.0.0.1:{port}")
    try:
        with pytest.raises(PlaywrightError):
            req.get("/api/health")
    finally:
        req.dispose()


# ---------- US-skeleton-2: Home page ----------

def test_US_skeleton_2_1_home_happy_path(page, base_url, shot):
    """US-skeleton-2.1 (story US-skeleton-2): / shows the h1 with status 200."""
    resp = page.goto(base_url + "/")
    page.wait_for_load_state("networkidle")
    shot(page, "US-skeleton-2.1-home")
    assert resp.status == 200
    expect(page.get_by_role("heading", level=1, name=HEADING)).to_be_visible()


def test_US_skeleton_2_2_home_page_title(page, base_url):
    """US-skeleton-2.2 (story US-skeleton-2): tab title contains SweetMemories."""
    page.goto(base_url + "/")
    page.wait_for_load_state("networkidle")
    assert "SweetMemories" in page.title()


def test_US_skeleton_2_3_home_server_rendered(api):
    """US-skeleton-2.3 (story US-skeleton-2): plain GET HTML contains the heading text."""
    r = api.get("/")
    assert r.status == 200
    assert HEADING in r.text()


def test_US_skeleton_2_4_home_sets_no_cookies(page, context, base_url):
    """US-skeleton-2.4 (story US-skeleton-2): no Set-Cookie and no browser cookies."""
    resp = page.goto(base_url + "/")
    page.wait_for_load_state("networkidle")
    # Response.headers omits Set-Cookie; all_headers() includes it.
    assert "set-cookie" not in resp.all_headers()
    assert context.cookies() == []


def test_US_skeleton_2_5_home_no_console_errors(page, base_url):
    """US-skeleton-2.5 (story US-skeleton-2): no console errors on /."""
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(base_url + "/")
    page.wait_for_load_state("networkidle")
    assert errors == []


def test_US_skeleton_2_6_unknown_path_not_found(page, base_url, shot):
    """US-skeleton-2.6 (story US-skeleton-2): /does-not-exist is 404 Page not found."""
    resp = page.goto(base_url + "/does-not-exist")
    page.wait_for_load_state("networkidle")
    shot(page, "US-skeleton-2.6-not-found")
    assert resp.status == 404
    expect(page.get_by_text("Page not found")).to_be_visible()
    expect(page.get_by_role("heading", level=1, name=HEADING)).to_have_count(0)
