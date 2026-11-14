"""E2E tests for the homepage feature (docs/features/homepage.md).

Single file for the feature, per the e2e-from-user-stories skill. Task 12
(e2e-homepage) adds the remaining US-homepage scenarios here. Public session,
no cookies.

Already covered: US-homepage-8.4. US-homepage-8.5 (pinned copy present) is
added by task 12, once the sections that render the copy exist.
"""
import re
from urllib.parse import urlparse

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


# ---------------------------------------------------------------------------
# Task 02 (page shell: header, nav, anchors, footer).
# US-homepage-2 scenarios 1 to 6 and US-homepage-8 scenario 2. Scenarios 2.2,
# 2.6 and 2.4 need section headings that later tasks add; they
# skip (BLOCKED) while a section is still an empty placeholder.
# Deferred: the mobile header (anchors hidden below 768 px, only logo and Sign
# in shown) belongs to US-homepage-10.1 and is tested in task 12, like 8.5.
# ---------------------------------------------------------------------------
NAV_LABELS = ["Who it is for", "How it works", "Templates", "Sign in"]
SECTION_HEADINGS = {
    "who": "A little corner of the internet for everyone who loves each other.",
    "how": "From a pile of photos to a page, in four easy steps.",
    "templates": "Start simple, or tell the whole story.",
}


def _in_viewport(page, locator):
    box = locator.bounding_box()
    vh = page.viewport_size["height"]
    return box is not None and box["y"] < vh and box["y"] + box["height"] > 0


def _wait_in_viewport(page, locator):
    """Poll until the heading is in the viewport (smooth scrolling safe)."""
    handle = locator.element_handle()
    page.wait_for_function(
        "el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }",
        arg=handle,
    )


# Sections whose task has not shipped yet. Each section task (04, 05, 06) removes
# its entry; once removed, a missing heading FAILS instead of skipping.
PENDING_SECTION_TASKS = {"who": "04", "how": "05", "templates": "06"}


def _heading_or_block(page, anchor):
    h = page.get_by_role("heading", name=SECTION_HEADINGS[anchor])
    if h.count() == 0:
        if anchor in PENDING_SECTION_TASKS:
            pytest.skip(f"BLOCKED: task {PENDING_SECTION_TASKS[anchor]} (heading for #{anchor} not shipped yet)")
        pytest.fail(f"heading for #{anchor} missing: {SECTION_HEADINGS[anchor]!r}")
    return h.first


def test_US_homepage_2_1_nav_links_in_order(page, base_url, shot):
    """US-homepage-2.1 (story US-homepage-2): navigation "Main" lists the four links in order at 1440 px."""
    page.goto(base_url + "/", wait_until="networkidle")
    nav = page.get_by_role("navigation", name="Main")
    assert nav.count() == 1
    links = nav.get_by_role("link")
    assert links.all_inner_texts() == NAV_LABELS
    for i in range(len(NAV_LABELS)):
        assert links.nth(i).is_visible()
    shot(page, "US-homepage-2.1")


@pytest.mark.parametrize("anchor,label", [("who", "Who it is for"), ("how", "How it works"), ("templates", "Templates")])
def test_US_homepage_2_2_anchor_links(page, base_url, anchor, label):
    """US-homepage-2.2 (story US-homepage-2): an anchor link sets the hash and brings the section heading into view."""
    page.goto(base_url + "/", wait_until="networkidle")
    page.get_by_role("navigation", name="Main").get_by_role("link", name=label).click()
    page.wait_for_function(f"location.hash === '#{anchor}'")
    assert page.url.endswith(f"#{anchor}")
    heading = _heading_or_block(page, anchor)
    _wait_in_viewport(page, heading)
    assert _in_viewport(page, heading)


def test_US_homepage_2_3_sign_in_navigates(page, base_url):
    """US-homepage-2.3 (story US-homepage-2): clicking Sign in goes to /sign-in.

    TODO(task 09): /sign-in is a 404 today; add the "Sign in" heading check once that page exists.
    """
    page.goto(base_url + "/", wait_until="networkidle")
    page.get_by_role("navigation", name="Main").get_by_role("link", name="Sign in").click()
    page.wait_for_url(re.compile(r"/sign-in$"))
    assert urlparse(page.url).path == "/sign-in"


def test_US_homepage_2_4_logo_returns_to_top(page, base_url):
    """US-homepage-2.4 (story US-homepage-2): from /#templates the logo goes to / and scrolls to the top."""
    page.goto(base_url + "/#templates", wait_until="networkidle")
    scrollable = page.evaluate("document.documentElement.scrollHeight > innerHeight")
    # TODO(task 12): drop the `scrollable` conditions so the scroll-to-top check always runs.
    if scrollable:
        # Deep-link scrolling must work once the page can scroll; fail, do not skip.
        page.wait_for_function("window.scrollY > 0")
    page.get_by_role("banner").get_by_role("link", name="SweetMemories").click()
    page.wait_for_function("location.hash === ''")
    assert urlparse(page.url).path == "/"
    assert urlparse(page.url).fragment == ""
    if scrollable:
        page.wait_for_function("window.scrollY === 0")
        assert page.evaluate("window.scrollY") == 0


def test_US_homepage_2_5_keyboard_tab_order_and_focus_ring(page, base_url, shot):
    """US-homepage-2.5 (story US-homepage-2): Tab reaches logo then each nav link in order, each with a visible focus indicator."""
    page.goto(base_url + "/", wait_until="networkidle")
    expected = ["SweetMemories"] + NAV_LABELS
    seen = []
    for _ in expected:
        page.keyboard.press("Tab")
        info = page.evaluate(
            """() => {
              const el = document.activeElement;
              const cs = getComputedStyle(el);
              let bgEl = document.querySelector('header'), bg = 'rgba(0, 0, 0, 0)';
              while (bgEl) {
                bg = getComputedStyle(bgEl).backgroundColor;
                if (!bg.endsWith(', 0)') && bg !== 'transparent') break;
                bgEl = bgEl.parentElement;
              }
              return {text: el.innerText.trim(), outlineStyle: cs.outlineStyle,
                      outlineWidth: parseFloat(cs.outlineWidth), tag: el.tagName,
                      outlineColor: cs.outlineColor, pageBg: bg};
            }"""
        )
        assert info["tag"] == "A"
        assert info["outlineStyle"] != "none" and info["outlineWidth"] > 0, f"no focus ring on {info['text']!r}"
        assert info["outlineColor"] != info["pageBg"], f"focus ring blends into page background on {info['text']!r}"
        assert not info["outlineColor"].endswith(", 0)"), f"transparent focus ring on {info['text']!r}"
        seen.append(info["text"])
    assert seen == expected
    shot(page, "US-homepage-2.5")


def test_US_homepage_2_6_deep_link_templates(page, base_url):
    """US-homepage-2.6 (story US-homepage-2): opening /#templates scrolls the Templates heading into view."""
    page.goto(base_url + "/#templates", wait_until="networkidle")
    heading = _heading_or_block(page, "templates")
    _wait_in_viewport(page, heading)
    assert _in_viewport(page, heading)


def test_US_homepage_8_2_footer_contentinfo(page, base_url, shot):
    """US-homepage-8.2 (story US-homepage-8): contentinfo landmark shows "SweetMemories" and the tagline."""
    page.goto(base_url + "/", wait_until="networkidle")
    footer = page.get_by_role("contentinfo")
    assert footer.count() == 1
    footer.scroll_into_view_if_needed()
    assert footer.is_visible()
    text = footer.inner_text()
    assert "SweetMemories" in text
    assert "Small pages for the moments worth keeping." in text
    shot(page, "US-homepage-8.2")


# ---------------------------------------------------------------------------
# Task 03 (hero). US-homepage-1 scenarios 1 to 6 and 9 (7 and 8 are above).
# ---------------------------------------------------------------------------
H1_TEXT = "Every little moment deserves a home."


def _hero_cta(page):
    return page.get_by_role("main").get_by_role("link", name="Start with Google").first


def test_US_homepage_1_1_hero_happy_path(pw, page, base_url, shot):
    """US-homepage-1.1 (story US-homepage-1): 200, one h1, sub copy and both CTAs visible without scrolling."""
    response = page.goto(base_url + "/", wait_until="networkidle")
    assert response.status == 200
    h1 = page.get_by_role("heading", level=1)
    assert h1.count() == 1
    assert h1.inner_text().replace("\n", " ").strip() == H1_TEXT
    sub = page.get_by_text("Turn first steps, birthdays and street parties into tiny pages")
    assert sub.first.is_visible()
    for link in (_hero_cta(page), page.get_by_role("link", name="See how it works")):
        assert link.is_visible()
        assert _in_viewport(page, link)
    shot(page, "US-homepage-1.1")


def test_US_homepage_1_2_reassurance_below_buttons(page, base_url):
    """US-homepage-1.2 (story US-homepage-1): "No password to make." is visible below the buttons."""
    page.goto(base_url + "/", wait_until="networkidle")
    line = page.get_by_text("No password to make.").first
    assert line.is_visible()
    cta_box = _hero_cta(page).bounding_box()
    assert line.bounding_box()["y"] >= cta_box["y"] + cta_box["height"] - 1


def test_US_homepage_1_3_example_address_is_plain_text(page, base_url, shot):
    """US-homepage-1.3 (story US-homepage-1): collage shows "Bob's first day" and the address, not as a link."""
    page.goto(base_url + "/", wait_until="networkidle")
    assert page.get_by_text("Bob's first day", exact=True).first.is_visible()
    address = page.get_by_text("sam.sweetmemories.com/bobs-first-day", exact=True).first
    assert address.is_visible()
    assert address.locator("xpath=ancestor-or-self::a").count() == 0
    assert page.locator("a[href*='sam.sweetmemories.com']").count() == 0
    shot(page, "US-homepage-1.3")


def test_US_homepage_1_4_see_how_it_works(page, base_url):
    """US-homepage-1.4 (story US-homepage-1): "See how it works" sets #how and shows the How it works heading."""
    page.goto(base_url + "/", wait_until="networkidle")
    page.get_by_role("link", name="See how it works").click()
    page.wait_for_function("location.hash === '#how'")
    assert page.url.endswith("#how")
    heading = _heading_or_block(page, "how")
    _wait_in_viewport(page, heading)
    assert _in_viewport(page, heading)


def test_US_homepage_1_5_start_cta_goes_to_sign_in(page, base_url):
    """US-homepage-1.5 (story US-homepage-1): hero "Start with Google" navigates to /sign-in."""
    page.goto(base_url + "/", wait_until="networkidle")
    _hero_cta(page).click()
    page.wait_for_url(re.compile(r"/sign-in$"))
    assert urlparse(page.url).path == "/sign-in"


def test_US_homepage_1_6_server_rendered(pw, base_url):
    """US-homepage-1.6 (story US-homepage-1): plain HTTP HTML, tags stripped, has the h1 text and the CTA."""
    req = pw.request.new_context(base_url=base_url)
    try:
        r = req.get("/")
        assert r.status == 200
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", r.text()))
        assert "Every little moment deserves a home" in text
        assert "Start with Google" in text
    finally:
        req.dispose()


def test_US_homepage_1_9_console_clean(page, base_url):
    """US-homepage-1.9 (story US-homepage-1): no console errors or hydration warnings after load."""
    bad = []
    page.on("console", lambda m: bad.append(m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: bad.append(str(e)))
    page.goto(base_url + "/", wait_until="networkidle")
    assert bad == [], f"console problems: {bad}"
