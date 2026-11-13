# Feature: homepage-seo

**Status:** todo
**Side:** both
- backend: per-environment `SITE_URL` and `SITE_INDEXABLE` read on the server ([ADR 0006](../adr/0006-per-environment-site-url-and-indexing.md)), and the static assets (icons, manifest, OG image) served by the Worker with correct content types, cache headers and no cookies.
- front-end: the head tags on the `/` route: title, description, canonical, robots, Open Graph, Twitter, JSON-LD, theme-color, and icon and manifest links.

**Mockup:** [Landing2.dc.html](../ui/Homepage/light%20pink/Landing2.dc.html) (the `<helmet>` block)

Tasks: [../tasks/homepage-seo/](../tasks/homepage-seo/) (01 to 04). ADR: [0006](../adr/0006-per-environment-site-url-and-indexing.md). Open questions: [../decisions/homepage-feature.md](../decisions/homepage-feature.md) (Q-assets, Q-copy, Q-pricing), [../decisions/homepage-adr.md](../decisions/homepage-adr.md). Related: [homepage](homepage.md).

## Goal

`/` is described correctly to search engines and shows a rich preview when its link is shared, and dev is never indexed.

## Summary and assumptions

- The mockup's `<helmet>` hard-codes `https://sweetmemories.com/...`, which would be wrong on dev. URLs become root-relative, or absolute from `SITE_URL`.
- `og/home.png`, `favicon-32.png`, `apple-touch-icon.png` and `site.webmanifest` are referenced but do not exist in the repo. There is no `public/` folder yet (Q-assets).
- Values are read through `process.env` (nodejs_compat), with `.env` locally, as `src/env.d.ts` already does. Nothing reads `cloudflare:workers` env.
- E2E tests go in `e2e/homepage-seo/`.

## Scope

**In scope**
- Head tags on `/` only. `/sign-in` gets only `noindex`, covered by [homepage](homepage.md).
- `SITE_URL` and `SITE_INDEXABLE` for local and dev (`.env`, `.env.example`, `wrangler.jsonc` `env.dev.vars`, `src/env.d.ts`).
- A `public/` folder with `favicon.svg`, `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `site.webmanifest`, `og/home.png` and `_headers`.
- E2E suite `e2e/homepage-seo/`.

**Out of scope**
- Production environment creation and production values of the vars (documented only).
- `robots.txt`, `sitemap.xml` and search-console verification.
- SEO for User home pages and Memory pages.
- Final design-made assets, unless Q-assets says design provides them now.
- Analytics and social pixels.

## User stories

**US-homepage-seo-1: Title and description**
- **Story:** As a search engine user, I want an accurate title and summary, so that I know what the site is before clicking.
- **Scenarios:**
  1. *Happy path*: **Given** the app is running, **When** a client fetches `/` without JavaScript, **Then** `<title>` is "SweetMemories: little pages for family moments" and `<meta name="description">` is exactly "Turn first steps, birthdays and street parties into tiny pages your family and friends can open and share. Free to start with Google." (the mockup's "open, share and add to" is replaced by owner-only wording; see the Copy subsection of [homepage](homepage.md)). The raw HTML must not contain "add to".
  2. *One of each:* **Given** the HTML of `/`, **When** it is parsed, **Then** it contains exactly one `<title>` and exactly one `meta[name=description]`. The root default title is not duplicated.
  3. *Other pages:* **Given** the app is running, **When** a client fetches `/does-not-exist`, **Then** the response is `404` and its HTML has no canonical link and no `og:url` pointing at the home page.

**US-homepage-seo-2: Social share preview**
- **Story:** As someone sharing the SweetMemories link, I want a rich preview card, so that friends see what it is.
- **Scenarios:**
  1. *Open Graph:* **Given** production config (`SITE_URL=https://sweetmemories.com`), **When** a client fetches `/`, **Then** the HTML has `og:type=website`, `og:site_name=SweetMemories`, `og:url=https://sweetmemories.com/`, `og:title="Every little moment deserves a home"`, `og:description` (the agreed description), `og:image=https://sweetmemories.com/og/home.png`, `og:image:width=1200`, `og:image:height=630`, `og:image:alt` and `og:locale=en_US`.
  2. *Twitter:* **Given** the same config, **When** a client fetches `/`, **Then** the HTML has `twitter:card=summary_large_image`, and `twitter:title`, `twitter:description`, `twitter:image` and `twitter:image:alt` match the OG values.
  3. *Image reachable:* **Given** the app is running, **When** a client fetches `/og/home.png`, **Then** the status is `200`, `Content-Type` is `image/png`, the image is 1200×630 px, and no `Set-Cookie` header is sent.
  4. *Dev uses dev URLs:* **Given** dev config (`SITE_URL=https://sweetmemories-dev.haubuitatmp.workers.dev`), **When** a client fetches `/` on dev, **Then** `og:url`, `og:image` and `twitter:image` start with the dev URL, not with `https://sweetmemories.com`.
  5. *Host header ignored (security):* **Given** any environment, **When** a client fetches `/` with the header `Host: evil.example` or `X-Forwarded-Host: evil.example`, **Then** no absolute URL in the HTML contains `evil.example`.

**US-homepage-seo-3: Canonical and indexing per environment**
- **Story:** As the product owner, I want production indexed and test environments hidden, so that search results only point at the real site.
- **Scenarios:**
  1. *Production:* **Given** production config (`SITE_INDEXABLE=true`), **When** a client fetches `/`, **Then** `<link rel="canonical" href="https://sweetmemories.com/">` and `<meta name="robots" content="index, follow">` are present.
  2. *Dev:* **Given** dev config (`SITE_INDEXABLE=false`), **When** a client fetches `/` on dev, **Then** `<meta name="robots" content="noindex, nofollow">` is present and the canonical is `https://sweetmemories-dev.haubuitatmp.workers.dev/`.
  3. *Indexing flag missing fails safe:* **Given** `SITE_INDEXABLE` is unset, **When** a client fetches `/`, **Then** robots is `noindex, nofollow`.
  4. *Site URL missing fails safe:* **Given** `SITE_URL` is unset or not an absolute http(s) origin (for example `not-a-url`), **When** a client fetches `/`, **Then** the status is `200`, the page renders, there is no canonical link, no `og:url`, `og:image`, `twitter:image` or JSON-LD `url`, and robots is `noindex, nofollow`.
  5. *Query strings:* **Given** production config, **When** a client fetches `/?utm_source=x`, **Then** the canonical is still `https://sweetmemories.com/`.

**US-homepage-seo-4: Icons and manifest**
- **Story:** As a visitor, I want a recognisable icon in my tab and on my home screen, so that I can find SweetMemories again.
- **Scenarios:**
  1. *Icon links:* **Given** a client fetches `/`, **When** the head is parsed, **Then** it has an SVG icon link (`/favicon.svg`), a 32×32 PNG icon link (`/favicon-32.png`), a 180×180 `apple-touch-icon` link (`/apple-touch-icon.png`), a `manifest` link (`/site.webmanifest`) and `<meta name="theme-color" content="#FFB6C8">`.
  2. *Assets served:* **Given** the app runs as a Worker (`pnpm build && pnpm start`, or dev), **When** a client fetches each linked icon and `/site.webmanifest`, **Then** each returns `200` with the right `Content-Type` (`image/svg+xml`, `image/png`, `application/manifest+json`), a `Cache-Control` header, and no `Set-Cookie`.
  3. *Manifest content:* **Given** a client fetches `/site.webmanifest`, **When** it is parsed as JSON, **Then** `name` is "SweetMemories", `theme_color` is "#FFB6C8" and `icons` lists at least the 180 px PNG.
  4. *Default favicon:* **Given** a client fetches `/favicon.ico`, **When** the response arrives, **Then** the status is `200`, not `404`.

**US-homepage-seo-5: Structured data**
- **Story:** As a search engine, I want structured data about the site, so that I can show the site name correctly.
- **Scenarios:**
  1. *Happy path:* **Given** production config, **When** a client fetches `/`, **Then** it contains exactly one `script[type="application/ld+json"]` whose JSON has `@context=https://schema.org`, `@type=WebSite`, `name=SweetMemories`, `url=https://sweetmemories.com/` and the agreed description.
  2. *Valid JSON:* **Given** the JSON-LD script, **When** it is parsed, **Then** it is valid JSON and contains no `</script` sequence and no unescaped `<`.

## Acceptance criteria

- `/` has exactly one title, description, canonical, robots tag, the full OG and Twitter set, theme-color, icon and manifest links, and one valid WebSite JSON-LD, all matching the agreed copy.
- Absolute URLs come only from `SITE_URL`, never from the request `Host` or `X-Forwarded-Host`. Production is `index, follow`. Any other or missing value is `noindex, nofollow`. A missing or invalid `SITE_URL` drops every absolute-URL tag instead of guessing.
- Values are read through `process.env` and work under both `pnpm dev` and `pnpm start`. `.env.example` documents them.
- The OG image (1200×630 PNG), SVG, ICO and PNG icons, apple-touch-icon and `site.webmanifest` are served from `public/` with correct content types, cache headers and no cookies.
- The 404 page carries none of the home page's canonical or OG tags.

## Risks and security notes

- **Host header injection:** absolute URLs come only from `SITE_URL`, never from `Host` or `X-Forwarded-Host` (US-homepage-seo-2.5).
- **JSON-LD injection:** serialise with `<` escaped, even though the content is static.
- **Dev indexing:** dev is public on workers.dev; without `noindex` it could be indexed as a duplicate of production. The failure mode is "not indexed".
- **Config read path:** `pnpm dev` (Vite) does not read wrangler vars, and Nitro merges `wrangler.jsonc` into its output. S1 must verify the values under both `pnpm dev` and `pnpm start`, or the head silently falls back to noindex with no canonical.
