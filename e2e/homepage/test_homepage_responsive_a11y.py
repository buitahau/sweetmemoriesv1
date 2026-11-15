"""US-homepage-10 (responsive, accessible and calm motion): one test per scenario 1 to 6.

Run against a local or dev URL, never production:
    E2E_BASE_URL=http://localhost:3000 pytest e2e/homepage/test_homepage_responsive_a11y.py
Needs `pip install axe-playwright-python` (bundles axe-core, no network at run time).
"""
import pytest
from axe_playwright_python.sync_playwright import Axe


@pytest.fixture
def open_home(pw, base_url):
    """Open `/` in a fresh context with the given viewport and media settings."""
    opened = []

    def _open(width, height, **ctx_kwargs):
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": width, "height": height}, **ctx_kwargs)
        pg = ctx.new_page()
        pg.goto(base_url + "/", wait_until="networkidle")
        opened.append((ctx, browser))
        return pg

    yield _open
    for ctx, browser in opened:
        ctx.close()
        browser.close()


def _fully_in_viewport(page, locator):
    box = locator.bounding_box()
    vp = page.viewport_size
    return (
        box is not None
        and box["x"] >= 0
        and box["y"] >= 0
        and box["x"] + box["width"] <= vp["width"]
        and box["y"] + box["height"] <= vp["height"]
    )


def _no_horizontal_scroll(page):
    return page.evaluate(
        "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
    )


def test_US_homepage_10_1_mobile_375(open_home, shot):
    """US-homepage-10.1 (story US-homepage-10): at 375x812 no horizontal scroll, h1 and CTA visible, header shows only logo and Sign in; at 768 all four nav items show."""
    page = open_home(375, 812)
    assert _no_horizontal_scroll(page), "horizontal scrollbar at 375px"
    h1 = page.get_by_role("heading", level=1)
    assert _fully_in_viewport(page, h1), "h1 is not visible without scrolling"
    cta = page.get_by_role("link", name="Start with Google").first
    assert _fully_in_viewport(page, cta), "Start with Google is not visible without scrolling"
    nav = page.get_by_role("navigation", name="Main")
    assert nav.get_by_role("link", name="Sign in").is_visible()
    for label in ["Who it is for", "How it works", "Templates"]:
        assert not nav.get_by_role("link", name=label).is_visible(), f"{label} should be hidden below 768px"
    shot(page, "US-homepage-10_1_mobile_375")

    page = open_home(768, 1024)
    nav = page.get_by_role("navigation", name="Main")
    for label in ["Who it is for", "How it works", "Templates", "Sign in"]:
        assert nav.get_by_role("link", name=label).is_visible(), f"{label} missing at 768px"
    assert _no_horizontal_scroll(page)


def test_US_homepage_10_2_tablet_768_full_scroll(open_home, shot):
    """US-homepage-10.2 (story US-homepage-10): at 768x1024 no horizontal overflow or clipped text and every section from hero to footer is reachable."""
    page = open_home(768, 1024, reduced_motion="reduce")
    assert _no_horizontal_scroll(page)
    targets = [
        page.locator("main h1"),
        page.locator("#who"),
        page.locator("#how"),
        page.locator("#templates"),
        page.get_by_role("contentinfo"),
    ]
    for t in targets:
        t.first.scroll_into_view_if_needed()
        assert t.first.is_visible()
    # No element pokes out of the viewport horizontally (text cut off), ignoring decorative aria-hidden art.
    offenders = page.evaluate(
        """() => [...document.querySelectorAll('body *')]
          .filter(e => !e.closest('[aria-hidden="true"]') && e.getClientRects().length)
          .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); })
          .map(e => e.tagName + ' ' + (e.textContent || '').trim().slice(0, 40))"""
    )
    assert offenders == [], f"content outside the 768px viewport: {offenders}"
    shot(page, "US-homepage-10_2_tablet_768", full_page=True)


def test_US_homepage_10_3_reduced_motion_nothing_runs_content_visible(open_home, shot):
    """US-homepage-10.3 (story US-homepage-10): with reduced motion no animation runs and h1, Start with Google and every h2 have opacity 1 and are not hidden."""
    page = open_home(1440, 900, reduced_motion="reduce")
    page.wait_for_timeout(500)
    running = page.evaluate(
        "document.getAnimations().filter(a => a.playState === 'running').map(a => a.animationName || a.transitionProperty || 'unnamed')"
    )
    assert running == [], f"running animations under reduced motion: {running}"
    # No element declares a non-zero animation or transition.
    declared = page.evaluate(
        """() => [...document.querySelectorAll('*')].filter(e => {
          const cs = getComputedStyle(e);
          const dur = cs.transitionDuration.split(',').some(d => parseFloat(d) > 0);
          return (cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0) || dur;
        }).map(e => e.tagName + '.' + e.className)"""
    )
    assert declared == [], f"elements with animation or transition: {declared}"
    must_show = [page.get_by_role("heading", level=1), page.get_by_role("link", name="Start with Google").first]
    h2s = page.get_by_role("heading", level=2)
    assert h2s.count() >= 1
    must_show += [h2s.nth(i) for i in range(h2s.count())]
    for el in must_show:
        el.scroll_into_view_if_needed()
        style = el.evaluate("e => { const cs = getComputedStyle(e); return [cs.opacity, cs.visibility]; }")
        assert style[0] == "1", f"opacity {style[0]} on {el.inner_text()[:40]!r}"
        assert style[1] != "hidden"
    shot(page, "US-homepage-10_3_reduced_motion", full_page=True)


def test_US_homepage_10_4_heading_structure(open_home):
    """US-homepage-10.4 (story US-homepage-10): exactly one h1, each section has one h2, card titles are h3."""
    page = open_home(1440, 900)
    assert page.locator("h1").count() == 1
    for sid in ["who", "how", "templates"]:
        assert page.locator(f"#{sid} h2").count() == 1, f"#{sid} needs exactly one h2"
        assert page.locator(f"#{sid} h3").count() >= 1, f"#{sid} cards need h3 titles"
    # Every section element that has an h2 has exactly one; headings never skip a level.
    for section in page.locator("main section").all():
        assert section.locator("h2").count() <= 1
    levels = page.evaluate("[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1])")
    assert levels[0] == 1
    for prev, cur in zip(levels, levels[1:]):
        assert cur <= prev + 1, f"heading order skips a level: {levels}"


def test_US_homepage_10_5_decorative_art_hidden_from_screen_readers(open_home):
    """US-homepage-10.5 (story US-homepage-10): decorative svg, sun, cloud, hearts and stars are not announced."""
    page = open_home(1440, 900)
    exposed = page.evaluate(
        """() => [...document.querySelectorAll('svg')]
          .filter(s => !s.closest('[aria-hidden="true"]') && s.getAttribute('aria-hidden') !== 'true')
          .filter(s => !s.getAttribute('role') && !s.getAttribute('aria-label') && !s.querySelector('title'))
          .map(s => s.outerHTML.slice(0, 80))"""
    )
    assert exposed == [], f"decorative SVGs exposed to screen readers: {exposed}"


@pytest.mark.parametrize("width,height", [(1440, 900), (375, 812), (768, 1024)])
def test_US_homepage_10_6_axe_no_serious_or_critical(open_home, width, height):
    """US-homepage-10.6 (story US-homepage-10): axe-core reports no serious or critical violations, including colour contrast."""
    page = open_home(width, height, reduced_motion="reduce")
    results = Axe().run(page)
    bad = [
        f"{v['id']} ({v['impact']}): {[n['target'] for n in v['nodes']][:3]}"
        for v in results.response["violations"]
        if v["impact"] in ("serious", "critical")
    ]
    assert bad == [], f"axe violations at {width}px: {bad}"
