"""E2E tests for the homepage feature (docs/features/homepage.md).

Single file for the feature, per the e2e-from-user-stories skill. Task 12
(e2e-homepage) adds the remaining US-homepage scenarios here. Public session,
no cookies. Each test name carries its scenario id; see the test names for
coverage.
"""
import re
from urllib.parse import urlparse

import pytest
from playwright.sync_api import expect

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
    responses = []
    page.on("response", lambda r: responses.append(r))
    page.goto(base_url + "/", wait_until="networkidle")
    page.mouse.wheel(0, 100000)
    # Response.headers omits Set-Cookie; all_headers() includes it.
    set_cookie = [r.url for r in responses if "set-cookie" in r.all_headers()]
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
PENDING_SECTION_TASKS: dict = {}


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
    """US-homepage-2.3 (story US-homepage-2): clicking Sign in goes to /sign-in and shows the placeholder."""
    page.goto(base_url + "/", wait_until="networkidle")
    page.get_by_role("navigation", name="Main").get_by_role("link", name="Sign in").click()
    page.wait_for_url(re.compile(r"/sign-in$"))
    assert urlparse(page.url).path == "/sign-in"
    expect(page.get_by_role("heading", level=1, name="Sign in")).to_be_visible()


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
# Task 08 (final CTA). US-homepage-8 scenarios 1 and 5. Scenario 3 (no private
# data) is automated in task 12.
# ---------------------------------------------------------------------------
FINAL_CTA_H2 = "Start with the memory everyone keeps telling."


def test_US_homepage_8_1_final_cta_navigates_to_sign_in(page, base_url, shot):
    """US-homepage-8.1 (story US-homepage-8): at the bottom, the final CTA heading and a Start with Google link to /sign-in."""
    page.goto(base_url + "/", wait_until="networkidle")
    heading = page.get_by_role("heading", level=2, name=FINAL_CTA_H2)
    assert heading.count() == 1
    heading.scroll_into_view_if_needed()
    _settle(page)
    assert heading.is_visible()
    section = page.locator("section").filter(has=heading)
    link = section.get_by_role("link", name="Start with Google")
    assert link.is_visible()
    assert link.get_attribute("href") == "/sign-in"
    shot(page, "US-homepage-8.1")
    link.click()
    page.wait_for_url(re.compile(r"/sign-in/?$"))


PINNED_COPY = [
    "For families, little ones and whole neighborhoods",
    "Made for the people you love to share with",
    "Your page is live",
    "Share this link",
    "One page can be about one child, one summer or one street. Make it once and share it with everyone you love.",
    "Grandparents, parents and cousins in one place. Everyone can see the photos and the stories behind them.",
    "First steps, first days and every birthday from one to ten. A scrapbook that grows up with them.",
    "A street party, a class trip or a team season. Keep the day and share it with everyone who was there.",
    "A title, a few words and one photo. The simplest way to keep something.",
    "A year-by-year album. One page for each birthday, from one to ten.",
    "A trip or an outing told in moments, with a route and the best photos.",
    "Your family's home page. It lists everything you publish.",
    "A memory page about Bob.",
    "A memory page about Bob's first day.",
    "A page the whole street can open.",
    "It takes a template, a few photos and a few cozy minutes.",
]


@pytest.mark.parametrize("text", PINNED_COPY)
def test_US_homepage_8_5_pinned_copy_present(page, base_url, text):
    """US-homepage-8.5 (story US-homepage-8): each pinned copy string is present in the visible text of /."""
    page.goto(base_url + "/", wait_until="networkidle")
    body = page.locator("body").inner_text()
    body = re.sub(r"\s+", " ", body)
    assert text in body, f"pinned copy missing: {text!r}"


# ---------------------------------------------------------------------------
# Task 03 (hero). US-homepage-1 scenarios 1 to 6 and 9 (7 and 8 are above).
# ---------------------------------------------------------------------------
H1_TEXT = "Every little moment deserves a home."


def _settle(page):
    """Wait until entrance animations finish so visibility and screenshots are real."""
    page.wait_for_function(
        "document.getAnimations().every(a => a.effect && a.effect.getTiming().iterations === Infinity"
        " || a.playState !== 'running')"
    )


def _hero(page):
    return page.get_by_role("main").locator("section").first


def _hero_cta(page):
    return page.get_by_role("main").get_by_role("link", name="Start with Google").first


def test_US_homepage_1_1_hero_happy_path(page, base_url, shot):
    """US-homepage-1.1 (story US-homepage-1): 200, one h1, sub copy and both CTAs visible without scrolling."""
    response = page.goto(base_url + "/", wait_until="networkidle")
    assert response.status == 200
    _settle(page)
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
    _settle(page)
    line = page.get_by_text("No password to make.").first
    assert line.is_visible()
    cta_box = _hero_cta(page).bounding_box()
    assert line.bounding_box()["y"] >= cta_box["y"] + cta_box["height"] - 1


def test_US_homepage_1_3_example_address_is_plain_text(page, base_url, shot):
    """US-homepage-1.3 (story US-homepage-1): collage shows "Bob's first day" and the address, not as a link."""
    page.goto(base_url + "/", wait_until="networkidle")
    _settle(page)
    hero = _hero(page)
    assert hero.get_by_text("Bob's first day", exact=True).first.is_visible()
    address = hero.get_by_text("sam.sweetmemories.com/bobs-first-day", exact=True)
    assert address.count() == 1
    assert address.is_visible()
    assert address.locator("xpath=ancestor-or-self::a").count() == 0
    assert page.locator("a[href*='sam.sweetmemories.com']").count() == 0
    card = address.locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]")
    # The card floats forever, so it is never "stable"; freeze animations for the capture.
    shot(card, "US-homepage-1.3", animations="disabled")


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


def test_US_homepage_1_9_favicon_served(pw, base_url):
    """US-homepage-1.9: / links an icon and that href is served as an image (asset pipeline)."""
    req = pw.request.new_context(base_url=base_url)
    try:
        html = req.get("/").text()
        m = re.search(r'<link[^>]*rel="icon"[^>]*href="([^"]+)"', html) or re.search(
            r'<link[^>]*href="([^"]+)"[^>]*rel="icon"', html
        )
        assert m, "no rel=icon link in the head of /"
        r = req.get(m.group(1))
        assert r.status == 200
        assert "image/svg+xml" in r.headers.get("content-type", "")
    finally:
        req.dispose()


@pytest.mark.parametrize("width", [320, 360, 375, 400, 412, 414, 430, 480, 768, 1440])
def test_US_homepage_10_2_collage_no_overlap_small_screens(pw, base_url, width):
    """US-homepage-10.2: no collage text overlaps another element and the address is not cut off."""
    browser = pw.chromium.launch()
    try:
        ctx = browser.new_context(
            viewport={"width": width, "height": 800}, reduced_motion="reduce"
        )
        pg = ctx.new_page()
        pg.goto(base_url + "/", wait_until="networkidle")
        data = pg.evaluate(
            """() => {
              const rect = (r) => [r.left, r.top, r.right, r.bottom];
              const byText = (t) => [...document.querySelectorAll('div,span')].find(
                (d) => d.children.length === 0 && d.textContent.trim() === t);
              const textRect = (el) => {
                const rg = document.createRange(); rg.selectNodeContents(el);
                return rect(rg.getBoundingClientRect());
              };
              const live = document.querySelector('[data-testid="live-card"]');
              const polaroids = [...document.querySelectorAll('[data-testid="polaroid"]')];
              const addr = document.querySelector('[data-testid="hero-address"]');
              if (!live || !addr) return { missing: true };
              return {
                live: rect(live.getBoundingClientRect()),
                polaroids: polaroids.map((p) => rect(p.getBoundingClientRect())),
                caps: ['at the gate', 'new friends'].map((t) => textRect(byText(t))),
                texts: ["Bob's first day", 'Big backpack, bigger smile.'].map((t) => textRect(byText(t))),
                addrOverflow: [addr.scrollWidth, addr.clientWidth],
              };
            }"""
        )
        assert not data.get("missing"), "live-card or hero-address test id not found"
        apart = lambda a, b: a[2] <= b[0] or a[0] >= b[2] or a[3] <= b[1] or a[1] >= b[3]
        assert len(data["polaroids"]) == 3
        for c in data["caps"]:
            assert apart(c, data["live"]), f"caption {c} hits live card at {width}px"
        for t in data["texts"]:
            for p in data["polaroids"]:
                assert apart(t, p), f"title/subtitle {t} hits polaroid {p} at {width}px"
        assert data["addrOverflow"][0] <= data["addrOverflow"][1], "address is cut off"
    finally:
        browser.close()


@pytest.mark.parametrize("width", [375, 768])
def test_US_homepage_10_2_header_links_single_line(pw, base_url, width):
    """US-homepage-10.2: every visible header link is one line tall and the page does not scroll sideways."""
    browser = pw.chromium.launch()
    try:
        ctx = browser.new_context(viewport={"width": width, "height": 800}, reduced_motion="reduce")
        pg = ctx.new_page()
        pg.goto(base_url + "/", wait_until="networkidle")
        data = pg.evaluate(
            """() => {
              const links = [...document.querySelectorAll('header nav a')].filter(
                (a) => a.getClientRects().length > 0);
              return {
                scroll: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
                links: links.map((a) => {
                  const rg = document.createRange(); rg.selectNodeContents(a);
                  const lh = parseFloat(getComputedStyle(a).lineHeight) || parseFloat(getComputedStyle(a).fontSize) * 1.5;
                  return { text: a.textContent.trim(), h: rg.getBoundingClientRect().height, lh };
                }),
              };
            }"""
        )
        assert any(l["text"] == "Sign in" for l in data["links"]), "Sign in not visible"
        for l in data["links"]:
            assert l["h"] < l["lh"] * 1.5, f"{l['text']!r} wraps at {width}px: {l}"
        assert data["scroll"][0] <= data["scroll"][1], f"horizontal scroll at {width}px"
    finally:
        browser.close()


@pytest.mark.parametrize("width", [360, 375, 414])
def test_US_homepage_10_1_header_logo_and_sign_in_share_a_row(pw, base_url, width):
    """US-homepage-10.1: the logo and Sign in sit on one header row at phone widths."""
    browser = pw.chromium.launch()
    try:
        ctx = browser.new_context(viewport={"width": width, "height": 800}, reduced_motion="reduce")
        pg = ctx.new_page()
        pg.goto(base_url + "/", wait_until="networkidle")
        logo = pg.locator("header > a").first.bounding_box()
        sign_in = pg.get_by_role("navigation", name="Main").get_by_role("link", name="Sign in").bounding_box()
        assert sign_in["y"] < logo["y"] + logo["height"], f"Sign in wraps under the logo at {width}px"
    finally:
        browser.close()


# ---------------------------------------------------------------------------
# Task 04: US-homepage-3 (Who it is for)
# ---------------------------------------------------------------------------
WHO_HEADING = "A little corner of the internet for everyone who loves each other."
WHO_CARDS = [
    ("Families", "Grandpa's garden"),
    ("Little ones", "Mia, one to ten"),
    ("Neighborhoods and friends", "Maple Street party"),
]


def _who(page, base_url):
    page.goto(base_url + "/", wait_until="networkidle")
    sec = page.locator("section#who")
    sec.scroll_into_view_if_needed()
    return sec


def test_US_homepage_3_1_who_heading_and_three_cards(page, base_url, shot):
    """US-homepage-3.1 (story US-homepage-3): #who shows its heading and exactly three cards in order."""
    sec = _who(page, base_url)
    assert sec.get_by_role("heading", level=2).inner_text().strip() == WHO_HEADING
    cards = sec.locator("article")
    assert cards.count() == 3
    titles = [cards.nth(i).get_by_role("heading", level=3).inner_text().strip() for i in range(3)]
    assert titles == [t for t, _ in WHO_CARDS]
    shot(sec, "US-homepage-3_1_who")


def test_US_homepage_3_2_example_labels(page, base_url):
    """US-homepage-3.2 (story US-homepage-3): each card shows its example label, with the straight apostrophe."""
    sec = _who(page, base_url)
    cards = sec.locator("article")
    for i, (_, example) in enumerate(WHO_CARDS):
        assert example in cards.nth(i).inner_text()
    assert "Grandpa's garden" in cards.nth(0).inner_text()


def test_US_homepage_3_3_faces_hidden_from_screen_readers(page, base_url):
    """US-homepage-3.3 (story US-homepage-3): face illustrations are aria-hidden and absent from the accessibility tree."""
    sec = _who(page, base_url)
    cards = sec.locator("article")
    for i in range(3):
        card = cards.nth(i)
        svgs = card.locator("svg")
        assert svgs.count() > 0
        hidden = card.evaluate(
            "el => [...el.querySelectorAll('svg')].every(s => s.closest('[aria-hidden=\"true\"]') !== null)"
        )
        assert hidden, "a face SVG is not inside an aria-hidden container"
        assert card.get_by_role("img").count() == 0


def test_US_homepage_3_4_card_hover_lift_off_under_reduced_motion(page, base_url):
    """US-homepage-3.4 (story US-homepage-3): hovering a card lifts it normally, but not under prefers-reduced-motion."""
    page.emulate_media(reduced_motion="no-preference")
    sec = _who(page, base_url)
    card = sec.locator("article").nth(0)
    card.hover()
    page.wait_for_timeout(500)
    assert card.evaluate("el => getComputedStyle(el).transform") != "none"

    page.emulate_media(reduced_motion="reduce")
    page.mouse.move(0, 0)
    card.hover()
    page.wait_for_timeout(100)
    assert card.evaluate("el => getComputedStyle(el).transform") == "none"


# ---------------------------------------------------------------------------
# Task 05 (How it works, US-homepage-4)
# ---------------------------------------------------------------------------
HOW_STEPS = ["Sign in with Google", "Choose a template", "Add photos and words", "Publish and share"]


def _how(page, base_url):
    page.goto(base_url + "/", wait_until="networkidle")
    sec = page.locator("section#how")
    sec.scroll_into_view_if_needed()
    return sec


def test_US_homepage_4_1_four_steps_in_order(page, base_url, shot):
    """US-homepage-4.1 (story US-homepage-4): #how has an ordered list of four steps in order."""
    sec = _how(page, base_url)
    items = sec.get_by_role("listitem")
    assert items.count() == 4
    titles = [items.nth(i).get_by_role("heading", level=3).inner_text().strip() for i in range(4)]
    assert titles == HOW_STEPS
    shot(sec, "US-homepage-4_1_how")


def test_US_homepage_4_2_step_four_matches_product_flow(page, base_url):
    """US-homepage-4.2 (story US-homepage-4): step 4 says the Memory goes live at its own address and invites sharing."""
    sec = _how(page, base_url)
    text = sec.get_by_role("listitem").nth(3).inner_text()
    assert "goes live at its own address" in text
    assert "Send the link to anyone." in text


def test_US_homepage_4_3_semantics_numbers_not_read_twice(page, base_url):
    """US-homepage-4.3 (story US-homepage-4): steps are an ol with 4 li; number badges are aria-hidden."""
    sec = _how(page, base_url)
    assert sec.locator("ol").count() == 1
    assert sec.locator("ol > li").count() == 4
    items = sec.locator("ol > li")
    for i in range(4):
        badge_hidden = items.nth(i).evaluate(
            "el => [...el.querySelectorAll('[aria-hidden=\"true\"]')].some(n => n.textContent.trim() === String(%d))" % (i + 1)
        )
        assert badge_hidden, f"step {i + 1} number badge is not aria-hidden"
    snap = sec.aria_snapshot()
    for n in "1234":
        assert f"text: \"{n}\"" not in snap and f"text: {n}\n" not in snap + "\n"


# ---------------------------------------------------------------------------
# Task 06 (Templates section). US-homepage-5 scenarios 1 to 4.
# ---------------------------------------------------------------------------
TEMPLATE_CARDS = [
    ("One small moment", "3 blocks"),
    ("Growing up: ages 1 to 10", "4 blocks"),
    ("An adventure", "8 blocks"),
]
BLOCK_CHIPS = ["Text", "Timeline", "Gallery", "Carousel", "3×3 Photo Grid"]


def _templates(page, base_url):
    page.goto(base_url + "/", wait_until="networkidle")
    sec = page.locator("section#templates")
    sec.scroll_into_view_if_needed()
    return sec


def test_US_homepage_5_1_heading_and_three_template_cards(page, base_url, shot):
    """US-homepage-5.1 (story US-homepage-5): #templates shows the heading and three Template cards with block counts."""
    sec = _templates(page, base_url)
    assert sec.get_by_role("heading", level=2).inner_text().strip() == SECTION_HEADINGS["templates"]
    cards = sec.locator("article")
    assert cards.count() == 3
    for i, (name, count) in enumerate(TEMPLATE_CARDS):
        card = cards.nth(i)
        assert card.get_by_role("heading", level=3).inner_text().strip() == name
        assert count in card.inner_text()
    shot(sec, "US-homepage-5_1_templates")


def test_US_homepage_5_2_block_chips_exact_and_ordered(page, base_url, shot):
    """US-homepage-5.2 (story US-homepage-5): "Made from building blocks" chips are exactly the five Blocks, in order."""
    sec = _templates(page, base_url)
    assert sec.get_by_role("heading", name="Made from building blocks").count() == 1
    chips = [t.strip() for t in sec.locator("ul > li").all_inner_texts()]
    assert chips == BLOCK_CHIPS
    text = sec.inner_text()
    assert "Curved timeline" not in text
    assert "Before and after" not in text
    shot(sec, "US-homepage-5_2_chips")


def test_US_homepage_5_3_illustrative_only_no_navigation_no_requests(page, base_url):
    """US-homepage-5.3 (story US-homepage-5): clicking a Template card does not navigate and makes no network request."""
    sec = _templates(page, base_url)
    assert sec.locator("a").count() == 0
    requests = []
    page.on("request", lambda r: requests.append(r.url))
    url_before = page.url
    sec.locator("article").first.click()
    page.wait_for_timeout(500)
    assert page.url == url_before
    assert requests == []


def test_US_homepage_5_4_unapproved_template_not_listed(page, base_url):
    """US-homepage-5.4 (story US-homepage-5, security rule 4): an unapproved Template name never appears on /."""
    pytest.skip(
        "BLOCKED: no database or Template storage exists yet, so an unapproved Template "
        "cannot be created. Holds by construction (static section, no data source); "
        "replace this skip once Templates and the review queue exist."
    )


# --- US-homepage-6: Moments worth keeping ---------------------------------

MOMENT_SUBTITLE = "A few of the small pages you could make today."
MOMENT_CHIPS = [
    "Bob's first day",
    "Grandpa's garden",
    "Maple Street party",
    "Class of 3B",
    "Mia, one to ten",
    "The lake trip",
    "Nana's recipes",
    "Our new puppy",
]


def _moments(page, base_url):
    page.goto(base_url + "/", wait_until="networkidle")
    sec = page.locator("section#moments")
    sec.scroll_into_view_if_needed()
    return sec


def test_US_homepage_6_1_moments_subtitle_and_eight_chips(page, base_url, shot):
    """US-homepage-6.1 (story US-homepage-6): "Moments worth keeping" shows the subtitle and eight chips in order."""
    sec = _moments(page, base_url)
    assert sec.get_by_role("heading", level=2).inner_text().strip() == "Moments worth keeping"
    assert sec.get_by_text(MOMENT_SUBTITLE, exact=True).is_visible()
    chips = [t.strip() for t in sec.locator("ul > li").all_inner_texts()]
    assert chips == MOMENT_CHIPS
    shot(sec, "US-homepage-6_1_moments")


def test_US_homepage_6_2_moment_chips_are_not_links(page, base_url):
    """US-homepage-6.2 (story US-homepage-6): clicking "Bob's first day" does not change the URL."""
    sec = _moments(page, base_url)
    assert sec.locator("a").count() == 0
    url_before = page.url
    sec.get_by_text("Bob's first day", exact=True).click()
    page.wait_for_timeout(500)
    assert page.url == url_before


# --- US-homepage-7: Addresses ----------------------------------------------

ADDRESS_HEADING = "Your family name first, then a page for each memory."
ADDRESS_ROWS = [
    ("sam.sweetmemories.com", "Your family's home page. It lists everything you publish."),
    ("sam.sweetmemories.com/bob", "A memory page about Bob."),
    ("sam.sweetmemories.com/first-day-of-bob", "A memory page about Bob's first day."),
    ("sam.sweetmemories.com/maple-street-party", "A page the whole street can open."),
]


def _addresses(page, base_url):
    page.goto(base_url + "/", wait_until="networkidle")
    sec = page.locator("section#addresses")
    sec.scroll_into_view_if_needed()
    return sec


def test_US_homepage_7_1_four_address_rows_in_order(page, base_url, shot):
    """US-homepage-7.1 (story US-homepage-7): the list shows four address rows in order, each with its description."""
    sec = _addresses(page, base_url)
    assert sec.get_by_role("heading", level=2).inner_text().strip() == ADDRESS_HEADING
    rows = sec.locator("ul > li")
    assert rows.count() == 4
    for i, (url, desc) in enumerate(ADDRESS_ROWS):
        lines = [ln.strip() for ln in rows.nth(i).inner_text().splitlines() if ln.strip()]
        assert lines == [url, desc]
    shot(sec, "US-homepage-7_1_addresses")


def test_US_homepage_7_2_addresses_are_plain_text(page, base_url):
    """US-homepage-7.2 (story US-homepage-7): clicking the second address does not navigate; no links."""
    sec = _addresses(page, base_url)
    assert sec.locator("a").count() == 0
    url_before = page.url
    sec.locator("ul > li").nth(1).click()
    page.wait_for_timeout(500)
    assert page.url == url_before


def test_US_homepage_7_3_home_page_vs_memory_pages(page, base_url):
    """US-homepage-7.3 (story US-homepage-7): row 1 is the family home page; rows 2 to 4 describe Memory pages."""
    sec = _addresses(page, base_url)
    rows = sec.locator("ul > li")
    first = rows.nth(0).inner_text()
    assert "home page" in first and "lists everything you publish" in first
    for i in (1, 2, 3):
        assert "page" in rows.nth(i).inner_text().lower()
        assert "home page" not in rows.nth(i).inner_text()
    assert [rows.nth(i).inner_text().count("memory page") for i in (1, 2)] == [1, 1]


# ---------------------------------------------------------------------------
# US-homepage-9: sign-in placeholder (task 09)
# ---------------------------------------------------------------------------
def test_US_homepage_9_1_sign_in_placeholder_happy_path(page, base_url, shot):
    """US-homepage-9.1 (story US-homepage-9): /sign-in is 200 with heading, text and a Back to home link to /."""
    resp = page.goto(base_url + "/sign-in", wait_until="networkidle")
    assert resp.status == 200
    expect(page.get_by_role("heading", level=1, name="Sign in")).to_be_visible()
    expect(page.get_by_text("Google sign-in is coming soon.")).to_be_visible()
    shot(page, "us-homepage-9-1-sign-in")
    link = page.get_by_role("link", name="Back to home")
    assert link.get_attribute("href") == "/"
    link.click()
    page.wait_for_url(re.compile(r"/$"))
    assert urlparse(page.url).path == "/"
    expect(page.get_by_role("heading", level=1).first).to_be_visible()
    expect(page.get_by_role("heading", level=1, name="Sign in")).to_have_count(0)


def test_US_homepage_9_2_sign_in_no_cookies_no_google(page, base_url):
    """US-homepage-9.2 (story US-homepage-9): no Set-Cookie, no browser cookies, no request to accounts.google.com."""
    responses, hosts = [], set()
    page.on("response", lambda r: responses.append(r))
    page.on("request", lambda r: hosts.add(urlparse(r.url).netloc) if r.url.startswith("http") else None)
    page.goto(base_url + "/sign-in", wait_until="networkidle")
    # Response.headers omits Set-Cookie; all_headers() includes it.
    set_cookie = [r.url for r in responses if "set-cookie" in r.all_headers()]
    assert set_cookie == [], f"responses set cookies: {set_cookie}"
    assert page.context.cookies() == []
    assert not {h for h in hosts if "google" in h}, f"Google requested: {hosts}"


def _meta_tags(html):
    from html.parser import HTMLParser

    found = []

    class _P(HTMLParser):
        def handle_starttag(self, tag, attrs):
            if tag == "meta":
                found.append(attrs)

    _P().feed(html)
    return found


def test_US_homepage_9_3_sign_in_not_indexed(pw, base_url):
    """US-homepage-9.3 (story US-homepage-9): served HTML has <meta name="robots" content="noindex">."""
    req = pw.request.new_context(base_url=base_url)
    try:
        r = req.get("/sign-in")
        assert r.status == 200
        metas = [
            {k.lower(): (v or "") for k, v in attrs}
            for attrs in _meta_tags(r.text())
        ]
        robots = [m for m in metas if m.get("name", "").lower() == "robots"]
        assert robots, "robots meta missing"
        assert "noindex" in robots[0].get("content", "").lower()
        assert "set-cookie" not in {h["name"].lower() for h in r.headers_array}
    finally:
        req.dispose()
