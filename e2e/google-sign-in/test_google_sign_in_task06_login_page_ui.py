"""US-google-sign-in-1 (Login page displays), one test per scenario 1.1 to 1.7.

Task 06 (docs/tasks/google-sign-in/06-login-page-ui-from-mockup.md) builds the idle Login page, so only
US-google-sign-in-1 applies. US-2 to 6 (click, loading, callback, redirects) belong to later tasks.
Run against a local or dev URL, never production:
    E2E_BASE_URL=http://localhost:3000 pytest e2e/google-sign-in/test_google_sign_in_task06_login_page_ui.py
Needs `pip install axe-playwright-python`. Screenshots go to e2e/google-sign-in/screenshots (git-ignored).
"""
import os
import pathlib
import re
import urllib.request
from urllib.parse import urlparse

import pytest
from axe_playwright_python.sync_playwright import Axe
from playwright.sync_api import expect

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")
SHOTS = pathlib.Path(__file__).parent / "screenshots"
SUBTITLE = "Sign in to make a page for the moments your family keeps talking about."
H1 = "Welcome! Come on in."


@pytest.fixture(scope="module")
def browser(pw):
    b = pw.chromium.launch()
    yield b
    b.close()


@pytest.fixture
def open_ctx(browser):
    contexts = []

    def _open(width=1440, height=900, **kw):
        ctx = browser.new_context(viewport={"width": width, "height": height}, **kw)
        contexts.append(ctx)
        return ctx

    yield _open
    for c in contexts:
        c.close()


def _shot(page, name):
    SHOTS.mkdir(exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{name}.png"))


def _goto_sign_in(page):
    page.goto(BASE + "/sign-in", wait_until="networkidle")


def _assert_login_page(page):
    assert urlparse(page.url).path == "/sign-in"
    expect(page.get_by_role("heading", level=1, name=H1)).to_be_visible()
    expect(page.get_by_role("button", name="Continue with Google")).to_be_visible()


def test_US_google_sign_in_1_1_from_homepage_header_link(open_ctx):
    """US-google-sign-in-1.1 (story US-google-sign-in-1): header Sign in opens the Login page."""
    page = open_ctx().new_page()
    page.goto(BASE + "/", wait_until="networkidle")
    page.get_by_role("navigation", name="Main").get_by_role("link", name="Sign in").click()
    page.wait_for_url(re.compile(r"/sign-in/?$"))
    _assert_login_page(page)
    _shot(page, "US-google-sign-in-1.1_header")


@pytest.mark.parametrize("section_name", ["hero", "final"])
def test_US_google_sign_in_1_1_from_homepage_start_with_google(open_ctx, section_name):
    """US-google-sign-in-1.1 (story US-google-sign-in-1): hero and final-CTA Start with Google links open the Login page."""
    page = open_ctx().new_page()
    page.goto(BASE + "/", wait_until="networkidle")
    links = page.get_by_role("link", name="Start with Google")
    assert links.count() >= 2
    link = links.first if section_name == "hero" else links.last
    link.scroll_into_view_if_needed()
    assert link.get_attribute("href") == "/sign-in"
    link.click()
    page.wait_for_url(re.compile(r"/sign-in/?$"))
    _assert_login_page(page)


def test_US_google_sign_in_1_2_content(open_ctx):
    """US-google-sign-in-1.2 (story US-google-sign-in-1): subtitle, New here divider, logo link, Back to home link, no placeholder."""
    page = open_ctx().new_page()
    resp = page.goto(BASE + "/sign-in", wait_until="networkidle")
    assert resp.status == 200
    expect(page.get_by_text(SUBTITLE)).to_be_visible()
    expect(page.get_by_text("New here?")).to_be_visible()
    logo = page.get_by_role("link", name="SweetMemories")
    expect(logo).to_be_visible()
    assert logo.get_attribute("href") == "/"
    back = page.get_by_role("link", name="Back to home")
    expect(back).to_be_visible()
    assert back.get_attribute("href") == "/"
    assert "Google sign-in is coming soon." not in page.content()
    _shot(page, "US-google-sign-in-1.2_desktop")


def test_US_google_sign_in_1_3_no_cookies_no_third_parties(open_ctx):
    """US-google-sign-in-1.3 (story US-google-sign-in-1): no Set-Cookie, no stored cookies, no Google requests."""
    ctx = open_ctx()
    page = ctx.new_page()
    urls, set_cookie = [], []
    page.on("request", lambda r: urls.append(r.url))
    page.on("response", lambda r: set_cookie.append(r.url) if "set-cookie" in {k.lower() for k in r.headers} else None)
    _goto_sign_in(page)
    assert set_cookie == [], f"responses set cookies: {set_cookie}"
    assert ctx.cookies() == []
    banned = ("accounts.google.com", "fonts.googleapis.com", "fonts.gstatic.com")
    hits = [u for u in urls if any(b in u for b in banned)]
    assert hits == [], f"third-party requests: {hits}"


def test_US_google_sign_in_1_4_not_indexed():
    """US-google-sign-in-1.4 (story US-google-sign-in-1): HTML carries a robots meta with noindex."""
    req = urllib.request.Request(BASE + "/sign-in", headers={"User-Agent": "Mozilla/5.0 (sweetmemories-e2e)"})
    with urllib.request.urlopen(req, timeout=15) as r:
        html = r.read().decode()
    metas = re.findall(r"<meta[^>]*name=[\"']robots[\"'][^>]*>", html, re.I)
    assert any("noindex" in m for m in metas), f"no robots noindex meta in {metas}"


def test_US_google_sign_in_1_5_mobile(open_ctx):
    """US-google-sign-in-1.5 (story US-google-sign-in-1): 375x812 has no horizontal scroll and a 44px+ button."""
    page = open_ctx(375, 812).new_page()
    _goto_sign_in(page)
    btn = page.get_by_role("button", name="Continue with Google")
    expect(btn).to_be_visible()
    assert btn.bounding_box()["height"] >= 44
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    assert overflow <= 0, f"horizontal overflow {overflow}px"
    _shot(page, "US-google-sign-in-1.5_mobile_375")


def test_US_google_sign_in_1_6_reduced_motion(open_ctx):
    """US-google-sign-in-1.6 (story US-google-sign-in-1): reduced motion has no running animation, h1 and button opaque."""
    page = open_ctx(reduced_motion="reduce").new_page()
    _goto_sign_in(page)
    page.wait_for_timeout(500)
    running = page.evaluate(
        "document.getAnimations().filter(a => a.playState === 'running').map(a => a.animationName || a.id || 'anim')"
    )
    assert running == [], f"running animations: {running}"
    for loc in (page.get_by_role("heading", level=1, name=H1), page.get_by_role("button", name="Continue with Google")):
        assert loc.evaluate("e => getComputedStyle(e).opacity") == "1"
    _shot(page, "US-google-sign-in-1.6_reduced_motion")


@pytest.mark.parametrize("width,height", [(1440, 900), (768, 1024), (375, 812)])
def test_US_google_sign_in_1_7_accessibility(open_ctx, width, height):
    """US-google-sign-in-1.7 (story US-google-sign-in-1): axe has no serious/critical issues; illustration hidden; Tab focus visible."""
    page = open_ctx(width, height, reduced_motion="reduce").new_page()
    _goto_sign_in(page)
    res = Axe().run(page)
    bad = [v for v in res.response["violations"] if v["impact"] in ("serious", "critical")]
    assert bad == [], [(v["id"], v["impact"]) for v in bad]
    # The decorative illustration must be hidden from assistive technology.
    assert page.locator("section[aria-hidden='true']").count() >= 1
    # Tab reaches the button and shows a visible focus outline.
    btn = page.get_by_role("button", name="Continue with Google")
    for _ in range(6):
        page.keyboard.press("Tab")
        if btn.evaluate("e => e === document.activeElement"):
            break
    assert btn.evaluate("e => e === document.activeElement"), "button not reachable with Tab"
    outline = btn.evaluate("e => { const s = getComputedStyle(e); return [s.outlineStyle, parseFloat(s.outlineWidth)]; }")
    assert outline[0] != "none" and outline[1] > 0, f"no visible focus outline: {outline}"
    _shot(page, f"US-google-sign-in-1.7_a11y_{width}")
