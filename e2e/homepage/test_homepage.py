"""E2E tests for the homepage feature (docs/features/homepage.md).

Single file for the feature, per the e2e-from-user-stories skill. Task 12
(e2e-homepage) adds the remaining US-homepage scenarios here. Public session,
no cookies.

Already covered: US-homepage-8.4. US-homepage-8.5 (pinned copy present) is
added by task 12, once the sections that render the copy exist.
"""
import pytest

# Collaboration-sensitive strings from spec Conflict 1. A Memory has one owner
# and no contributor or invite feature exists, so the page must not promise it.
UNBUILT_FEATURE_PHRASES = ["add to", "Invite people", "just added a photo", "12 cousins"]


@pytest.fixture(scope="module")
def home_html(pw, base_url):
    """Raw HTML of `/`, fetched once, with no cookies."""
    req = pw.request.new_context(base_url=base_url)
    try:
        r = req.get("/")
        assert r.status == 200
        yield r.text().lower()
    finally:
        req.dispose()


@pytest.mark.parametrize("phrase", UNBUILT_FEATURE_PHRASES)
def test_US_homepage_8_4_no_unbuilt_features_promised(home_html, phrase):
    """US-homepage-8.4 (story US-homepage-8): rendered HTML of / has no collaboration promise."""
    assert phrase.lower() not in home_html, f"/ promises an unbuilt feature: {phrase!r}"


# ---------------------------------------------------------------------------
# Task 01 (design tokens, self-hosted fonts, motion base). The remaining
# US-homepage scenarios depend on tasks 02 to 11 and are written in task 12.
# ---------------------------------------------------------------------------
from urllib.parse import urlparse  # noqa: E402


@pytest.fixture
def page(pw):
    browser = pw.chromium.launch()
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    pg = context.new_page()
    yield pg
    context.close()
    browser.close()


def test_US_homepage_1_7_no_cookies(page, base_url):
    """US-homepage-1.7 (story US-homepage-1): no Set-Cookie header and no browser cookies on /."""
    set_cookie = []
    page.on("response", lambda r: set_cookie.append(r.url) if "set-cookie" in r.headers else None)
    page.goto(base_url + "/", wait_until="networkidle")
    page.mouse.wheel(0, 100000)
    assert set_cookie == [], f"responses set cookies: {set_cookie}"
    assert page.context.cookies() == []


def test_US_homepage_1_8_all_requests_same_origin(page, base_url):
    """US-homepage-1.8 (story US-homepage-1): every request goes to the page's own origin, none to Google Fonts."""
    own = urlparse(base_url).netloc
    hosts = set()
    page.on("request", lambda r: hosts.add(urlparse(r.url).netloc) if r.url.startswith("http") else None)
    page.goto(base_url + "/", wait_until="networkidle")
    assert hosts == {own}, f"third-party hosts requested: {hosts - {own}}"
    assert not {h for h in hosts if "fonts.g" in h}


def test_US_homepage_1_8_font_preload_is_one_same_origin_woff2(page, base_url):
    """US-homepage-1.8 / task 01 Verification: exactly one font preload link; its href returns 200 font/woff2."""
    page.goto(base_url + "/", wait_until="networkidle")
    links = page.eval_on_selector_all(
        "link[rel=preload][as=font]",
        "els => els.map(e => ({href: e.href, type: e.type, cross: e.crossOrigin}))",
    )
    assert len(links) == 1, links
    assert links[0]["type"] == "font/woff2"
    assert links[0]["cross"] is not None
    assert urlparse(links[0]["href"]).netloc == urlparse(base_url).netloc
    assert "fredoka" in links[0]["href"].lower()
    r = page.request.get(links[0]["href"])
    assert r.status == 200
    assert "font/woff2" in r.headers.get("content-type", "")


_PROBE = """
() => {
  const el = document.createElement('div');
  el.id = 'sm-motion-probe';
  el.style.cssText = 'animation: sm-spin 1s linear infinite; transition: opacity 1s;';
  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  return {name: cs.animationName, transition: cs.transitionDuration};
}
"""


def test_US_homepage_10_3_reduced_motion_disables_animation_and_transition(page, base_url):
    """US-homepage-10.3 (story US-homepage-10): under prefers-reduced-motion the global rule turns off animations and transitions.

    A temporary probe element stands in for the animated sections that later tasks add.
    """
    page.emulate_media(reduced_motion="reduce")
    page.goto(base_url + "/", wait_until="networkidle")
    res = page.evaluate(_PROBE)
    assert res["name"] == "none"
    assert res["transition"] in ("0s", "0s, 0s")


def test_US_homepage_10_3_motion_allowed_keeps_animation(page, base_url):
    """US-homepage-10.3 control: without reduced motion the same probe animates, so the check above is meaningful."""
    page.emulate_media(reduced_motion="no-preference")
    page.goto(base_url + "/", wait_until="networkidle")
    assert page.evaluate(_PROBE)["name"] == "sm-spin"
