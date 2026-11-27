"""E2E checks for homepage-seo task 02 (docs/tasks/homepage-seo/02-static-icons-manifest-og.md).

One test per Given/When/Then scenario the task covers (US-homepage-seo-4 scenarios 2 to 4 and
US-homepage-seo-2 scenario 3), plus the task's manual Verification item (cache value from `_headers`).
The icon links on `/` arrive with task 03 (US-homepage-seo-4.1), so 4.2 fetches the asset paths the
spec names. All requests are public (no cookies). Run against `pnpm build && pnpm start` or a dev URL:

    .venv-e2e/bin/python .claude/skills/webapp-testing/scripts/with_server.py \
      --server "pnpm start" --port 3000 -- .venv-e2e/bin/pytest e2e/homepage-seo -rs

Cases skip as BLOCKED when no server answers at E2E_BASE_URL (default http://localhost:3000). 4.2 and
T02_V3 need the Worker (Vite's `pnpm dev` ignores public/_headers) and skip as BLOCKED under `pnpm dev`.

### US-homepage-seo-2.3 OG image reachable
Story: US-homepage-seo-2   Type: happy   Session: public
Given: the app is running
When: a client fetches /og/home.png
Then: 200, Content-Type image/png, image is 1200x630 px, no Set-Cookie

### US-homepage-seo-4.2 Icon and manifest assets served
Story: US-homepage-seo-4   Type: happy + security (no cookies)   Session: public
Given: the app runs as a Worker
When: a client fetches each icon and /site.webmanifest
Then: each is 200 with the right Content-Type, a Cache-Control header and no Set-Cookie

### US-homepage-seo-4.3 Manifest content
Story: US-homepage-seo-4   Type: happy   Session: public
Given: a client fetches /site.webmanifest
When: it is parsed as JSON
Then: name "SweetMemories", theme_color "#FFB6C8", icons list at least the 180 px PNG

### US-homepage-seo-4.4 Default favicon
Story: US-homepage-seo-4   Type: edge (browsers request it unprompted)   Session: public
Given: a client fetches /favicon.ico
When: the response arrives
Then: 200 (not 404), Content-Type image/x-icon or image/vnd.microsoft.icon
"""
import json
import re
import struct

import pytest
from playwright.sync_api import Error as PlaywrightError

from helpers import ROOT

ICONS = {
    "/favicon.svg": "image/svg+xml",
    "/favicon-32.png": "image/png",
    "/apple-touch-icon.png": "image/png",
    "/site.webmanifest": "application/manifest+json",
}
ICO_TYPES = {"image/x-icon", "image/vnd.microsoft.icon"}


@pytest.fixture(scope="module")
def api(pw, base_url):
    """Cookie-free Playwright request context against the app (public visitor)."""
    ctx = pw.request.new_context(base_url=base_url, extra_http_headers={"User-Agent": "e2e-homepage-seo"})
    try:
        ctx.get("/api/health", timeout=10_000)
    except PlaywrightError as e:
        ctx.dispose()
        pytest.skip(f"BLOCKED: no server at {base_url} ({str(e).splitlines()[0]})")
    yield ctx
    ctx.dispose()


@pytest.fixture(scope="module")
def worker(api, base_url):
    """Skips as BLOCKED when the target is a Vite dev server (`pnpm dev`): only the Worker (`pnpm start` or
    dev) applies public/_headers, so Cache-Control can only be checked there. Vite answers /@vite/client."""
    if api.get("/@vite/client").status == 200:
        pytest.skip(f"BLOCKED: {base_url} is a Vite dev server, which does not apply public/_headers; "
                    "run the Cache-Control checks against the Worker (`pnpm start` or dev)")
    return api


def _media_type(resp):
    return resp.headers.get("content-type", "").split(";")[0].strip().lower()


def _set_cookies(resp):
    return [h["value"] for h in resp.headers_array if h["name"].lower() == "set-cookie"]


def _png_size(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a PNG"
    assert data[12:16] == b"IHDR", "PNG has no IHDR chunk first"
    return struct.unpack(">II", data[16:24])


def _headers_rules():
    """Map path pattern -> Cache-Control from public/_headers (the source our build copies)."""
    rules, current = {}, None
    for line in (ROOT / "public/_headers").read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            current = line.strip()
        elif current and line.strip().lower().startswith("cache-control:"):
            rules[current] = line.split(":", 1)[1].strip()
    return rules


def test_US_homepage_seo_2_3_og_image_reachable(api, browser, base_url, shot):
    """US-homepage-seo-2.3 (story US-homepage-seo-2): /og/home.png is 200, image/png, 1200x630, no Set-Cookie."""
    resp = api.get("/og/home.png")
    assert resp.status == 200, f"/og/home.png answered {resp.status}"
    assert _media_type(resp) == "image/png"
    assert _png_size(resp.body()) == (1200, 630)
    assert _set_cookies(resp) == [], "the OG image must not set cookies"

    ctx = browser.new_context(viewport={"width": 1200, "height": 630})
    try:
        page = ctx.new_page()
        page.goto(base_url + "/og/home.png")
        page.wait_for_load_state("networkidle")
        size = page.evaluate("() => { const i = document.images[0]; return i && [i.naturalWidth, i.naturalHeight]; }")
        assert size == [1200, 630], f"browser decoded the OG image as {size}"
        shot(page, "US-homepage-seo-2.3-og-image")
        assert ctx.cookies() == [], "visiting the OG image left cookies in the browser"
    finally:
        ctx.close()


def test_US_homepage_seo_4_2_icon_and_manifest_assets_served(worker):
    """US-homepage-seo-4.2 (story US-homepage-seo-4): each icon and the manifest is 200 with the right
    Content-Type, a Cache-Control header and no Set-Cookie."""
    api = worker
    problems = []
    for path, media in ICONS.items():
        resp = api.get(path)
        if resp.status != 200:
            problems.append(f"{path}: status {resp.status}")
            continue
        if _media_type(resp) != media:
            problems.append(f"{path}: Content-Type {_media_type(resp)!r}, expected {media!r}")
        if not resp.headers.get("cache-control"):
            problems.append(f"{path}: no Cache-Control")
        if _set_cookies(resp):
            problems.append(f"{path}: sends Set-Cookie {_set_cookies(resp)}")
        if media == "image/png":
            want = {"/favicon-32.png": (32, 32), "/apple-touch-icon.png": (180, 180)}[path]
            if _png_size(resp.body()) != want:
                problems.append(f"{path}: size {_png_size(resp.body())}, expected {want}")
        if media == "image/svg+xml" and b"<svg" not in resp.body():
            problems.append(f"{path}: body is not SVG")
    assert problems == [], "\n".join(problems)


def test_US_homepage_seo_4_3_manifest_content(api):
    """US-homepage-seo-4.3 (story US-homepage-seo-4): the manifest parses as JSON with name SweetMemories,
    theme_color #FFB6C8 and a 180 px PNG icon."""
    resp = api.get("/site.webmanifest")
    assert resp.status == 200
    manifest = json.loads(resp.text())
    assert manifest["name"] == "SweetMemories"
    assert manifest["theme_color"] == "#FFB6C8"
    pngs_180 = [i for i in manifest.get("icons", [])
                if i.get("type") == "image/png" and "180x180" in i.get("sizes", "").split()]
    assert pngs_180, f"no 180x180 PNG in icons: {manifest.get('icons')}"
    icon = api.get(pngs_180[0]["src"])
    assert icon.status == 200 and _png_size(icon.body()) == (180, 180), "the listed 180 px icon is not served at 180x180"


def test_US_homepage_seo_4_4_default_favicon_ico(api):
    """US-homepage-seo-4.4 (story US-homepage-seo-4): /favicon.ico is 200 (not 404) with an icon Content-Type."""
    resp = api.get("/favicon.ico")
    assert resp.status == 200, f"/favicon.ico answered {resp.status}"
    assert _media_type(resp) in ICO_TYPES, f"Content-Type {_media_type(resp)!r}"
    body = resp.body()
    assert body[:4] == b"\x00\x00\x01\x00", "favicon.ico is not an ICO file"
    assert _set_cookies(resp) == []


def test_T02_V3_cache_control_matches_headers_file(worker):
    """T02-V3 (task Verification): each asset's Cache-Control equals the value in public/_headers."""
    api = worker
    rules = _headers_rules()
    assert rules, "public/_headers has no Cache-Control rules"
    problems = []
    for pattern, value in rules.items():
        path = pattern.replace("*", "home.png") if pattern == "/og/*" else pattern
        got = api.get(path).headers.get("cache-control", "")
        if not re.fullmatch(re.escape(value), got.strip()):
            problems.append(f"{path}: Cache-Control {got!r}, expected {value!r}")
    assert problems == [], "\n".join(problems)
