# 03 Home route head tags

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** homepage 00, 01, 02
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (`<helmet>`)

## What to change

Build the head of the `/` route with a pure head builder taking `{ siteUrl, indexable }` from task 01.

## Checklist

- [ ] Title and the pinned description
- [ ] Canonical `${siteUrl}/` with no query string
- [ ] Robots `index, follow` or `noindex, nofollow`
- [ ] Full OG and Twitter set
- [ ] theme-color, and icon and manifest links (root-relative)
- [ ] One WebSite JSON-LD, serialised with `<` escaped as `\u003c`
- [ ] When `siteUrl` is null: omit canonical, every absolute-URL tag and the JSON-LD `url`
- [ ] Root route's default `<title>` does not duplicate on `/`
- [ ] Tags kept off the 404 page

## Verification

- [ ] Vitest on the head builder: `siteUrl=https://sweetmemories.com` with `indexable=true` produces exactly the tags in US-homepage-seo-2.1, 3.1 and 5.1; `indexable=false` gives `noindex, nofollow`; `siteUrl=null` gives no canonical and no `og:url`; JSON-LD contains no `</script` and no raw `<`.
- [ ] Manual: `curl -s localhost:3000/ | grep -c '<title>'` prints 1. A link preview tool on the dev URL shows the card.
