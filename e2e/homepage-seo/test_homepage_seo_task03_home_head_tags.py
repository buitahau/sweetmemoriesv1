"""E2E suite for the `/` head tags (homepage-seo task 03, docs/tasks/homepage-seo/03-home-head-tags.md).

One test per Given/When/Then scenario of docs/features/homepage-seo.md that the head tags deliver:
US-homepage-seo-1.1 to 1.3, 2.1, 2.2, 2.4, 2.5, 3.1 to 3.6, 4.1, 5.1 and 5.2. The asset scenarios
(2.3, 4.2 to 4.4) live in test_homepage_seo_task02_static_assets.py. Every scenario reads the raw HTML
(no JavaScript) except 3.6, which loads `/` in Chromium and compares the live DOM with the raw HTML.
All requests are public (no cookies).

The server config cannot change during a run, so each run declares it with E2E_SEO_PROFILE
(task 04 table). Scenarios tied to another profile skip with the reason; the rest run in every
profile and assert against the expected origin of the profile:

| Profile            | Server config                                              | Profile-only scenarios   |
| ------------------ | ---------------------------------------------------------- | ------------------------ |
| dev (default)      | dev values, or local SITE_URL=<E2E_BASE_URL>, not indexable | 2.4, 3.2                 |
| prod-like          | SITE_URL=https://sweetmemories.com SITE_INDEXABLE=true      | 2.1, 2.2, 3.1, 3.5, 5.1  |
| unset-indexable    | SITE_INDEXABLE unset (SITE_URL as dev)                      | 3.3                      |
| bad-url            | SITE_URL=not-a-url                                          | 3.4                      |
| path-url           | SITE_URL=https://sweetmemories.com/path SITE_INDEXABLE=true | 3.4 (origin reduction)   |

Local example (prod-like):
    SITE_URL=https://sweetmemories.com SITE_INDEXABLE=true .venv-e2e/bin/python \
      .claude/skills/webapp-testing/scripts/with_server.py --server "pnpm dev" --port 3000 -- \
      env E2E_SEO_PROFILE=prod-like .venv-e2e/bin/pytest e2e/homepage-seo -rs

### US-homepage-seo-1.1 Title and description in the raw HTML
Story: US-homepage-seo-1   Type: happy   Session: public
Given: the app is running   When: a client fetches / without JavaScript
Then: <title> is the agreed title, meta description is exactly the agreed description, no "add to"
Data: Copy section of the spec
Script: e2e/homepage-seo/test_homepage_seo_task03_home_head_tags.py::test_US_homepage_seo_1_1_title_and_description

### US-homepage-seo-1.2 Exactly one title and one description
Story: US-homepage-seo-1   Type: edge   Session: public
Given: the HTML of /   When: it is parsed   Then: one <title>, one meta[name=description]
Script: ...::test_US_homepage_seo_1_2_one_title_and_one_description

### US-homepage-seo-1.3 404 page has no home canonical or og:url
Story: US-homepage-seo-1   Type: failure   Session: public
Given: the app is running   When: a client fetches /does-not-exist
Then: 404, no canonical link, no og:url pointing at the home page
Script: ...::test_US_homepage_seo_1_3_not_found_page_has_no_home_tags

### US-homepage-seo-2.1 Open Graph set (prod-like)
Story: US-homepage-seo-2   Type: happy   Session: public
Given: SITE_URL=https://sweetmemories.com   When: a client fetches /
Then: og:type, og:site_name, og:url, og:title, og:description, og:image, width, height, alt, locale
Script: ...::test_US_homepage_seo_2_1_open_graph_tags

### US-homepage-seo-2.2 Twitter set equals OG (prod-like)
Story: US-homepage-seo-2   Type: happy   Session: public
Then: twitter:card=summary_large_image; twitter title, description, image, image:alt equal the OG values
Script: ...::test_US_homepage_seo_2_2_twitter_tags_equal_og

### US-homepage-seo-2.4 Dev uses dev URLs (dev)
Story: US-homepage-seo-2   Type: edge   Session: public
Then: og:url, og:image, twitter:image start with the target's own URL, not https://sweetmemories.com
Script: ...::test_US_homepage_seo_2_4_dev_uses_dev_urls

### US-homepage-seo-2.5 Forwarded host ignored
Story: US-homepage-seo-2   Type: security   Session: public
When: X-Forwarded-Host / Forwarded: host=evil.example (and locally Host: evil.example)
Then: no absolute URL in the HTML contains evil.example
Script: ...::test_US_homepage_seo_2_5_forwarded_host_ignored

### US-homepage-seo-3.1 Production canonical and index (prod-like)
Then: canonical https://sweetmemories.com/ and robots "index, follow"
Script: ...::test_US_homepage_seo_3_1_production_canonical_and_index

### US-homepage-seo-3.2 Dev noindex and dev canonical (dev)
Then: robots "noindex, nofollow"; canonical is the target's own URL + "/"
Script: ...::test_US_homepage_seo_3_2_dev_noindex_and_dev_canonical

### US-homepage-seo-3.3 Missing indexing flag fails safe (unset-indexable)
Then: robots "noindex, nofollow"
Script: ...::test_US_homepage_seo_3_3_missing_indexing_flag_is_noindex

### US-homepage-seo-3.4 Missing or invalid site URL fails safe (bad-url, path-url)
Then (bad-url): 200, page renders, no canonical, og:url, og:image, twitter:image or JSON-LD url,
robots "noindex, nofollow". (path-url): every absolute URL uses the origin, not the path.
Script: ...::test_US_homepage_seo_3_4_invalid_site_url_fails_safe

### US-homepage-seo-3.5 Query strings dropped from canonical (prod-like)
When: a client fetches /?utm_source=x   Then: canonical is https://sweetmemories.com/
Script: ...::test_US_homepage_seo_3_5_query_string_not_in_canonical

### US-homepage-seo-3.6 Head unchanged after hydration
Story: US-homepage-seo-3   Type: security (de-indexing)   Session: public, JavaScript on
Then: canonical, robots, og:url, og:image and JSON-LD in the live DOM equal the raw HTML
Script: ...::test_US_homepage_seo_3_6_head_unchanged_after_hydration

### US-homepage-seo-4.1 Icon, manifest and theme-color links
Then: one SVG icon (/favicon.svg), 32x32 PNG icon, 180x180 apple-touch-icon, manifest, theme-color #FFB6C8
Script: ...::test_US_homepage_seo_4_1_icon_and_manifest_links

### US-homepage-seo-5.1 WebSite JSON-LD (prod-like)
Then: one ld+json script: @context, @type WebSite, name, url https://sweetmemories.com/, description
Script: ...::test_US_homepage_seo_5_1_website_json_ld

### US-homepage-seo-5.2 JSON-LD is valid and escaped
Story: US-homepage-seo-5   Type: security (injection)   Session: public
Then: valid JSON, no "</script" and no raw "<"
Script: ...::test_US_homepage_seo_5_2_json_ld_valid_and_escaped
"""
import json
import os
import re
from html.parser import HTMLParser
from urllib.parse import urlparse

import pytest

TITLE = "SweetMemories: little pages for family moments"
DESCRIPTION = ("Turn first steps, birthdays and street parties into tiny pages your family and friends "
               "can open and share. Free to start with Google.")
SHARE_TITLE = "Every little moment deserves a home"
IMAGE_ALT = "A SweetMemories page called Bob's first day, with photos and a smiling sun"
PROD = "https://sweetmemories.com"

PROFILE = os.environ.get("E2E_SEO_PROFILE", "dev")
PROFILES = {"dev", "prod-like", "unset-indexable", "bad-url", "path-url"}
if PROFILE not in PROFILES:
    raise RuntimeError(f"E2E_SEO_PROFILE must be one of {sorted(PROFILES)}, got {PROFILE!r}")


def only(*profiles):
    return pytest.mark.skipif(PROFILE not in profiles,
                              reason=f"profile {PROFILE!r}; this scenario needs E2E_SEO_PROFILE in {profiles}")


def _origin(url):
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}"


@pytest.fixture(scope="module")
def site_origin(base_url):
    """The origin the server's SITE_URL should produce under the declared profile (None: no absolute URLs)."""
    return {"prod-like": PROD, "path-url": PROD, "bad-url": None}.get(PROFILE, _origin(base_url))


class Head(HTMLParser):
    """Collects the tags the scenarios check, from the whole document (the head is SSR'd)."""

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.titles, self.meta, self.links, self.ld = [], [], [], []
        self._in = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        if tag == "title":
            self._in = "title"
            self.titles.append("")
        elif tag == "meta":
            self.meta.append(a)
        elif tag == "link":
            self.links.append(a)
        elif tag == "script" and a.get("type") == "application/ld+json":
            self._in = "ld"
            self.ld.append("")

    def handle_endtag(self, tag):
        if tag in ("title", "script"):
            self._in = None

    def handle_data(self, data):
        if self._in == "title":
            self.titles[-1] += data
        elif self._in == "ld":
            self.ld[-1] += data

    def metas(self, key):
        """All content values for meta[name=key] or meta[property=key]."""
        return [m.get("content") for m in self.meta if m.get("name") == key or m.get("property") == key]

    def one(self, key):
        values = self.metas(key)
        assert len(values) == 1, f"expected exactly one meta {key}, got {values}"
        return values[0]

    def rel(self, rel):
        return [l for l in self.links if rel in l.get("rel", "").split()]


def _raw_ld_blocks(html):
    return re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>([\s\S]*?)</script>', html)


@pytest.fixture(scope="module")
def home(fetch):
    """Raw HTML of `/` fetched once without JavaScript: (status, html, parsed head)."""
    status, _, body = fetch("/")
    return status, body, Head(body)


def _canonicals(head):
    return [l.get("href") for l in head.rel("canonical")]


# --- US-homepage-seo-1: Title and description --------------------------------------------------------


def test_US_homepage_seo_1_1_title_and_description(home):
    """US-homepage-seo-1.1 (story US-homepage-seo-1, happy): raw `/` has the agreed title and exact description."""
    status, body, head = home
    assert status == 200
    assert [t.strip() for t in head.titles] == [TITLE]
    assert head.one("description") == DESCRIPTION
    assert "add to" not in body, "the mockup's 'open, share and add to' wording must not ship"


def test_US_homepage_seo_1_2_one_title_and_one_description(home):
    """US-homepage-seo-1.2 (story US-homepage-seo-1, edge): exactly one <title> (root default not duplicated)
    and exactly one meta[name=description]."""
    _, body, head = home
    assert len(head.titles) == 1, head.titles
    assert len(re.findall(r"<title[\s>]", body)) == 1
    assert len([m for m in head.meta if m.get("name") == "description"]) == 1


def test_US_homepage_seo_1_3_not_found_page_has_no_home_tags(fetch, site_origin):
    """US-homepage-seo-1.3 (story US-homepage-seo-1, failure): /does-not-exist is 404 with no canonical
    and no og:url pointing at the home page."""
    status, _, body = fetch("/does-not-exist")
    assert status == 404
    head = Head(body)
    assert _canonicals(head) == [], f"404 page has a canonical: {_canonicals(head)}"
    home_urls = {f"{site_origin}/", PROD + "/"} if site_origin else {PROD + "/"}
    assert not [u for u in head.metas("og:url") if u in home_urls], head.metas("og:url")


# --- US-homepage-seo-2: Social share preview ---------------------------------------------------------


@only("prod-like")
def test_US_homepage_seo_2_1_open_graph_tags(home):
    """US-homepage-seo-2.1 (story US-homepage-seo-2, happy): production config gives the full OG set."""
    _, _, head = home
    expected = {
        "og:type": "website",
        "og:site_name": "SweetMemories",
        "og:url": PROD + "/",
        "og:title": SHARE_TITLE,
        "og:description": DESCRIPTION,
        "og:image": PROD + "/og/home.png",
        "og:image:width": "1200",
        "og:image:height": "630",
        "og:image:alt": IMAGE_ALT,
        "og:locale": "en_US",
    }
    assert {k: head.one(k) for k in expected} == expected


@only("prod-like")
def test_US_homepage_seo_2_2_twitter_tags_equal_og(home):
    """US-homepage-seo-2.2 (story US-homepage-seo-2, happy): summary_large_image card whose title,
    description, image and image alt equal the OG values."""
    _, _, head = home
    assert head.one("twitter:card") == "summary_large_image"
    for field in ("title", "description", "image", "image:alt"):
        assert head.one(f"twitter:{field}") == head.one(f"og:{field}"), field
    assert head.one("twitter:image") == PROD + "/og/home.png"


@only("dev")
def test_US_homepage_seo_2_4_dev_uses_dev_urls(home, site_origin):
    """US-homepage-seo-2.4 (story US-homepage-seo-2, edge): on dev, og:url, og:image and twitter:image
    start with the target's own URL, never https://sweetmemories.com."""
    _, _, head = home
    assert site_origin != PROD, "dev profile must not target the production origin"
    for key in ("og:url", "og:image", "twitter:image"):
        value = head.one(key)
        assert value.startswith(site_origin + "/"), f"{key}={value} does not start with {site_origin}"
        assert not value.startswith(PROD), f"{key}={value} uses the production URL"


def _absolute_urls(body):
    return re.findall(r'https?://[^\s"\'<>]+', body)


def test_US_homepage_seo_2_5_forwarded_host_ignored(fetch, base_url):
    """US-homepage-seo-2.5 (story US-homepage-seo-2, security): forged X-Forwarded-Host and Forwarded
    (and, locally, Host) never reach an absolute URL in `/`."""
    forged = {"X-Forwarded-Host": "evil.example", "Forwarded": "host=evil.example"}
    status, _, body = fetch("/", forged)
    assert status == 200
    assert not [u for u in _absolute_urls(body) if "evil.example" in u]
    assert "evil.example" not in body
    if urlparse(base_url).hostname in ("localhost", "127.0.0.1", "::1"):
        # Cloudflare rejects a foreign Host before the Worker runs, so this variant is local only.
        # A dev server may refuse the unknown host outright; whatever answers must not echo it.
        _, _, body = fetch("/", {**forged, "Host": "evil.example"})
        assert not [u for u in _absolute_urls(body) if "evil.example" in u]


# --- US-homepage-seo-3: Canonical and indexing per environment ---------------------------------------


@only("prod-like")
def test_US_homepage_seo_3_1_production_canonical_and_index(home):
    """US-homepage-seo-3.1 (story US-homepage-seo-3, happy): canonical https://sweetmemories.com/ and
    robots "index, follow"."""
    _, _, head = home
    assert _canonicals(head) == [PROD + "/"]
    assert head.one("robots") == "index, follow"


@only("dev")
def test_US_homepage_seo_3_2_dev_noindex_and_dev_canonical(home, site_origin):
    """US-homepage-seo-3.2 (story US-homepage-seo-3, happy): dev is "noindex, nofollow" with the dev
    URL as canonical."""
    _, _, head = home
    assert head.one("robots") == "noindex, nofollow"
    assert _canonicals(head) == [site_origin + "/"]


@only("unset-indexable")
def test_US_homepage_seo_3_3_missing_indexing_flag_is_noindex(home):
    """US-homepage-seo-3.3 (story US-homepage-seo-3, failure): SITE_INDEXABLE unset gives "noindex, nofollow"."""
    _, _, head = home
    assert head.one("robots") == "noindex, nofollow"


@only("bad-url", "path-url")
def test_US_homepage_seo_3_4_invalid_site_url_fails_safe(home, browser, base_url, shot):
    """US-homepage-seo-3.4 (story US-homepage-seo-3, failure): an invalid SITE_URL renders `/` with no
    absolute-URL tags and noindex; a SITE_URL with a path is reduced to its origin."""
    status, _, head = home
    assert status == 200
    if PROFILE == "bad-url":
        assert _canonicals(head) == []
        for key in ("og:url", "og:image", "twitter:image"):
            assert head.metas(key) == [], f"{key} present with an invalid SITE_URL"
        assert len(head.ld) == 1
        assert "url" not in json.loads(head.ld[0])
        assert head.one("robots") == "noindex, nofollow"
    else:
        assert _canonicals(head) == [PROD + "/"]
        assert head.one("og:url") == PROD + "/"
        assert head.one("og:image") == PROD + "/og/home.png"
        assert json.loads(head.ld[0])["url"] == PROD + "/"
    page = browser.new_page()
    try:
        page.goto(base_url + "/")
        page.wait_for_load_state("networkidle")
        assert page.get_by_role("heading", level=1).first.is_visible()
        shot(page, f"US-3.4_{PROFILE}_home_renders")
    finally:
        page.close()


@only("prod-like")
def test_US_homepage_seo_3_5_query_string_not_in_canonical(fetch):
    """US-homepage-seo-3.5 (story US-homepage-seo-3, edge): /?utm_source=x keeps canonical https://sweetmemories.com/."""
    status, _, body = fetch("/?utm_source=x")
    assert status == 200
    head = Head(body)
    assert _canonicals(head) == [PROD + "/"]
    assert head.one("og:url") == PROD + "/"


_LIVE_HEAD_JS = """() => {
  const attr = (sel, a) => Array.from(document.querySelectorAll(sel)).map(e => e.getAttribute(a));
  return {
    canonical: attr('link[rel="canonical"]', 'href'),
    robots: attr('meta[name="robots"]', 'content'),
    ogUrl: attr('meta[property="og:url"]', 'content'),
    ogImage: attr('meta[property="og:image"]', 'content'),
    ld: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(e => e.textContent),
    titles: document.querySelectorAll('title').length,
  };
}"""


def test_US_homepage_seo_3_6_head_unchanged_after_hydration(home, browser, base_url, shot):
    """US-homepage-seo-3.6 (story US-homepage-seo-3, security): after hydration and idle, the live DOM's
    canonical, robots, og:url, og:image and JSON-LD equal the raw HTML (never rewritten to noindex)."""
    _, _, raw = home
    expected = {
        "canonical": _canonicals(raw),
        "robots": raw.metas("robots"),
        "ogUrl": raw.metas("og:url"),
        "ogImage": raw.metas("og:image"),
        "ld": [json.loads(s) for s in raw.ld],
        "titles": len(raw.titles),
    }
    assert expected["robots"], "raw `/` has no robots meta"
    errors = []
    page = browser.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    try:
        page.goto(base_url + "/")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)  # let any late client head update land
        live = page.evaluate(_LIVE_HEAD_JS)
        live["ld"] = [json.loads(s) for s in live["ld"]]
        shot(page, f"US-3.6_{PROFILE}_hydrated_home")
    finally:
        page.close()
    assert errors == [], f"page errors during hydration: {errors}"
    assert live == expected


# --- US-homepage-seo-4: Icons and manifest -----------------------------------------------------------


def test_US_homepage_seo_4_1_icon_and_manifest_links(home):
    """US-homepage-seo-4.1 (story US-homepage-seo-4, happy): one SVG icon, 32x32 PNG icon, 180x180
    apple-touch-icon, manifest link (all root-relative) and theme-color #FFB6C8."""
    _, _, head = home
    icons = head.rel("icon")
    svg = [l for l in icons if l.get("type") == "image/svg+xml" or l.get("href", "").endswith(".svg")]
    assert [l.get("href") for l in svg] == ["/favicon.svg"], svg
    png32 = [l for l in icons if l.get("href") == "/favicon-32.png"]
    assert len(png32) == 1 and png32[0].get("sizes") == "32x32" and png32[0].get("type") == "image/png"
    touch = head.rel("apple-touch-icon")
    assert [(l.get("href"), l.get("sizes")) for l in touch] == [("/apple-touch-icon.png", "180x180")]
    assert [l.get("href") for l in head.rel("manifest")] == ["/site.webmanifest"]
    assert head.one("theme-color") == "#FFB6C8"


# --- US-homepage-seo-5: Structured data --------------------------------------------------------------


@only("prod-like")
def test_US_homepage_seo_5_1_website_json_ld(home):
    """US-homepage-seo-5.1 (story US-homepage-seo-5, happy): exactly one WebSite JSON-LD with the agreed values."""
    _, _, head = home
    assert len(head.ld) == 1
    data = json.loads(head.ld[0])
    assert data["@context"] == "https://schema.org"
    assert data["@type"] == "WebSite"
    assert data["name"] == "SweetMemories"
    assert data["url"] == PROD + "/"
    assert data["description"] == DESCRIPTION


def test_US_homepage_seo_5_2_json_ld_valid_and_escaped(home):
    """US-homepage-seo-5.2 (story US-homepage-seo-5, security): the JSON-LD parses as JSON and its raw
    text has no `</script` and no unescaped `<`."""
    _, body, head = home
    blocks = _raw_ld_blocks(body)
    assert len(blocks) == 1 == len(head.ld)
    raw = blocks[0]
    assert "</script" not in raw.lower()
    assert "<" not in raw
    data = json.loads(raw)
    assert data["@type"] == "WebSite"
