# 03 Home page route

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** 01
**Feature spec:** [project-skeleton](../../features/project-skeleton.md)
**Mockup:** none

## What to change

Home route `/`. Render a single `<h1>` "SweetMemories home page", styled with Tailwind utility classes only (centered, readable). Set the document title to "SweetMemories". No data loading, no client-only rendering, no cookies, no tracking scripts.

## Checklist

- [x] Home route with the h1
- [x] Document title "SweetMemories"
- [x] Component test

## Verification

- [ ] Vitest + Testing Library: home route renders a level-1 heading with "SweetMemories home page".
- [ ] Manual: `curl -s http://localhost:<port>/` returns HTML containing "SweetMemories home page"; browser shows the heading, tab title contains "SweetMemories", console clean, no cookies and no `Set-Cookie`.
- [ ] Covers US-skeleton-2 scenarios 1 to 5.
