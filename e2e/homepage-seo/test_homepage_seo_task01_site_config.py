"""E2E checks for homepage-seo task 01 (docs/tasks/homepage-seo/01-site-url-and-indexing-config.md).

Task 01 only adds config (SITE_INDEXABLE, getSiteConfig, the fetchSiteConfig server function); nothing
renders it until task 03 builds the `/` head from it. No US-homepage-seo scenario is observable from
task 01 alone, so cases are named after the task's checklist (T01-C*) and Verification (T01-V*) items;
the one-test-per-scenario suite is task 04. Live cases need a server at E2E_BASE_URL (default
http://localhost:3000, `pnpm build && pnpm start`) and skip as BLOCKED without one.
"""
import json
import re
import shutil
from urllib.parse import urlparse

import pytest

from helpers import ROOT, run

SCRATCH_OUTDIR = ROOT / "node_modules" / ".cache" / "e2e-homepage-seo-dry-run"


def _jsonc(path):
    """Parse wrangler.jsonc: drop // line comments (none of its strings contain //... except URLs, kept intact)."""
    text = re.sub(r'^\s*//.*$', "", path.read_text(), flags=re.M)
    return json.loads(text)


def _src(rel):
    return (ROOT / rel).read_text()


# --- Checklist (static) ----------------------------------------------------------------------------


def test_T01_C1_env_types_declare_site_indexable_next_to_site_url():
    """T01-C1: src/env.d.ts ProcessEnv declares SITE_INDEXABLE (optional string) right after SITE_URL."""
    types = _src("src/env.d.ts")
    assert re.search(r"\bSITE_INDEXABLE\?:\s*string", types)
    url_at, idx_at = types.index("SITE_URL?"), types.index("SITE_INDEXABLE?")
    assert 0 < idx_at - url_at < 300, "SITE_INDEXABLE is not declared next to SITE_URL"


def test_T01_C2_env_example_defaults_to_not_indexable_with_comment():
    """T01-C2: .env.example has SITE_INDEXABLE=false, a comment saying "true" is production only, and SITE_URL."""
    lines = _src(".env.example").splitlines()
    assert "SITE_INDEXABLE=false" in lines
    assert not any(l.startswith("SITE_INDEXABLE=true") for l in lines), "example must not enable indexing"
    i = lines.index("SITE_INDEXABLE=false")
    comment = " ".join(l for l in lines[max(0, i - 4):i] if l.startswith("#"))
    assert '"true"' in comment and "production" in comment.lower()
    assert "env.dev.vars" in comment
    assert any(l.startswith("SITE_URL=") for l in lines)


def test_T01_C3a_wrangler_dev_vars_set_site_indexable_false_and_no_top_level_vars():
    """T01-C3: wrangler.jsonc env.dev.vars has SITE_INDEXABLE "false" next to SITE_URL; no top-level vars."""
    cfg = _jsonc(ROOT / "wrangler.jsonc")
    assert "vars" not in cfg, "top-level vars are ignored by `wrangler dev --env dev`; do not add them"
    dev_vars = cfg["env"]["dev"]["vars"]
    assert dev_vars["SITE_INDEXABLE"] == "false"
    assert urlparse(dev_vars["SITE_URL"]).scheme == "https"
    assert "sweetmemories.com" != urlparse(dev_vars["SITE_URL"]).hostname, "dev must not use the production URL"


def test_T01_C3b_built_worker_config_is_accepted_with_the_dev_vars():
    """T01-C3: after `pnpm build`, `wrangler deploy --dry-run` accepts both the source and built config and binds the vars."""
    if not shutil.which("pnpm"):
        pytest.skip("BLOCKED: pnpm not available")
    built = ROOT / ".output/server/wrangler.json"
    if not built.exists():
        pytest.skip("BLOCKED: run `pnpm build` first (.output/server/wrangler.json missing)")
    r = run(["pnpm", "exec", "wrangler", "deploy", "--dry-run", "-c", "wrangler.jsonc", "--env", "dev",
             "--outdir", str(SCRATCH_OUTDIR / "src")], timeout=180)
    assert r.returncode == 0, (r.stdout + r.stderr)[-800:]
    assert re.search(r'env\.SITE_INDEXABLE \("false"\)', r.stdout), r.stdout[-800:]
    assert "env.SITE_URL" in r.stdout
    r2 = run(["pnpm", "exec", "wrangler", "deploy", "--dry-run", "-c", str(built),
              "--outdir", str(SCRATCH_OUTDIR / "built")], timeout=180)
    assert r2.returncode == 0, (r2.stdout + r2.stderr)[-800:]


def test_T01_C4_helper_reuses_auth_parser_and_takes_no_request_input():
    """T01-C4 (security, US-homepage-seo-2.5 groundwork): getSiteConfig() takes no arguments, reuses
    normalizeSiteUrl from the auth config and never reads Host, X-Forwarded-Host, Forwarded or the request."""
    src = _src("src/server/site/config.ts")
    assert re.search(r"import\s*\{[^}]*\bnormalizeSiteUrl\b[^}]*\}\s*from\s*'\.\./auth/config'", src)
    assert re.search(r"export function getSiteConfig\(\s*\)\s*:\s*SiteConfig", src)
    assert re.search(r"SITE_INDEXABLE\s*===\s*'true'", src), "indexable must require exactly \"true\""
    fn = _src("src/server/site/site-config.fn.ts")
    for code in (src, fn):
        code = re.sub(r"/\*[\s\S]*?\*/|^\s*//.*$", "", code, flags=re.M)  # comments may name the headers
        for forbidden in ("getRequest", "x-forwarded-host", "forwarded", "headers", "cloudflare:workers"):
            assert forbidden not in code.lower(), f"site config must not read {forbidden}"


def test_T01_C5_server_function_is_a_get_with_server_import_inside_handler():
    """T01-C5: fetchSiteConfig is a createServerFn GET whose server-only import stays inside the handler."""
    fn = _src("src/server/site/site-config.fn.ts")
    assert re.search(r"export const fetchSiteConfig\s*=\s*createServerFn\(\{\s*method:\s*'GET'\s*\}\)", fn)
    assert re.search(r"handler\([\s\S]*await import\('\./config'\)", fn)
    assert not re.search(r"^import .*'\./config'", fn, re.M), "static import would leak server code to the client"


def test_T01_C6_route_head_never_reads_process_env():
    """T01-C6 (hydration de-indexing risk): no route reads process.env (head() runs on the client too)."""
    hits = run(["git", "grep", "-n", "process.env", "--", "src/routes"])
    offending = [l for l in hits.stdout.splitlines() if ".test." not in l]
    assert offending == [], "\n".join(offending)


def test_T01_C7_infra_docs_document_site_indexable_and_shared_site_url():
    """T01-C7: local-development.md and dev-environment.md document SITE_INDEXABLE and that SITE_URL drives auth and SEO."""
    for rel in ("docs/infra/local-development.md", "docs/infra/dev-environment.md"):
        doc = _src(rel)
        assert "SITE_INDEXABLE" in doc, f"{rel} does not document SITE_INDEXABLE"
        assert "noindex" in doc, f"{rel} does not say what a non-true value does"
        assert re.search(r"SITE_URL[^\n]*(auth|Better Auth)[^\n]*SEO|SITE_URL[^\n]*SEO[^\n]*(auth|sign-in)",
                         doc, re.I), f"{rel} does not say SITE_URL drives both auth and SEO"


# --- Verification ------------------------------------------------------------------------------------


def test_T01_V1_V2_vitest_helper_and_auth_parser_suites_pass():
    """T01-V1 and T01-V2: the Vitest cases for the helper and the unchanged normalizeSiteUrl auth tests pass."""
    if not shutil.which("pnpm"):
        pytest.skip("BLOCKED: pnpm not available")
    r = run(["pnpm", "exec", "vitest", "run", "src/server/site/config.test.ts", "src/server/auth/auth.test.ts"],
            timeout=240)
    assert r.returncode == 0, (r.stdout + r.stderr)[-1500:]
    assert re.search(r"Test Files\s+2 passed \(2\)", r.stdout), r.stdout[-800:]


def test_T01_V3a_home_still_renders_with_the_new_config(fetch, browser, base_url, shot):
    """T01-V3 (precondition): with SITE_INDEXABLE bound, `/` answers 200 and renders in a browser."""
    status, _, body = fetch("/")
    assert status == 200
    assert "<html" in body.lower()
    page = browser.new_page()
    try:
        page.goto(base_url + "/")
        page.wait_for_load_state("networkidle")
        assert page.locator("h1").first.is_visible()
        shot(page, "T01-V3a_home")
    finally:
        page.close()


def test_T01_V3b_forwarded_host_never_reaches_html(fetch, base_url):
    """T01-V3 (security, same rule as US-homepage-seo-2.5): a forged forwarded host never shows up in `/`."""
    headers = {"X-Forwarded-Host": "evil.example", "Forwarded": "host=evil.example"}
    status, _, body = fetch("/", headers)
    assert status == 200
    assert "evil.example" not in body


def test_T01_V3c_home_head_uses_site_url_and_noindex(fetch, base_url):
    """T01-V3 (manual item, automated): `/` shows the target's own URL as canonical and `noindex, nofollow`
    (dev profile: local `SITE_URL=http://localhost:3000` or the dev URL, `SITE_INDEXABLE=false`)."""
    _, _, body = fetch("/")
    if not re.search(r'<meta[^>]+name="robots"', body):
        pytest.skip("BLOCKED: `/` has no robots meta yet; the head is rendered by homepage-seo task 03")
    origin = f"{urlparse(base_url).scheme}://{urlparse(base_url).netloc}"
    assert re.search(r'<meta[^>]+name="robots"[^>]+content="noindex, nofollow"', body)
    canon = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', body)
    assert canon and canon.group(1) == origin + "/", f"canonical {canon and canon.group(1)} != {origin}/"
