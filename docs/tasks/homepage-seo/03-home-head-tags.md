# 03 Home route head tags

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** homepage task 00 (pinned copy); homepage-seo tasks 01 and 02
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (`<helmet>`)

## What to change

Build the head of the `/` route with a pure head builder taking `{ siteUrl, indexable }`. The `/` route `loader` gets these from the task 01 server function, and `head()` builds the tags from `loaderData`. Never read `process.env` in `head()`: it also runs on the client, where the values are undefined, and would rewrite production to `noindex` with no canonical after hydration.

## Checklist

- [ ] `/` loader calls the task 01 server function; `head({ loaderData })` calls the head builder
- [ ] Title and the pinned description (Copy section of the spec)
- [ ] Canonical `${siteUrl}/` with no query string
- [ ] Robots `index, follow` or `noindex, nofollow`
- [ ] Full OG and Twitter set, with `og:image:alt` and `twitter:image:alt` set to the pinned alt text
- [ ] theme-color, and icon and manifest links (root-relative); `/favicon.svg` stays in the root head and is not duplicated
- [ ] One WebSite JSON-LD, serialised with `<` escaped as `<`
- [ ] When `siteUrl` is null: omit canonical, every absolute-URL tag and the JSON-LD `url`
- [ ] Root route's default `<title>` does not duplicate on `/`
- [ ] Tags kept off the 404 page

## Verification

- [ ] Vitest on the head builder: `siteUrl=https://sweetmemories.com` with `indexable=true` produces exactly the tags in US-homepage-seo-2.1, 3.1 and 5.1; `indexable=false` gives `noindex, nofollow`; `siteUrl=null` gives no canonical and no `og:url`; JSON-LD contains no `</script` and no raw `<`; the builder takes no request input.
- [ ] Manual: `curl -s localhost:3000/ | grep -c '<title>'` prints 1. In a browser, after the page is idle, the canonical and robots in the DOM equal the raw HTML. A link preview tool on the dev URL shows the card.
