# 06 Login page UI from mockup (idle state)

**Status:** done
**Side:** front-end
**Size:** M
**Dependencies:** none (can start now). Copy questions Q-copy-search, Q-copy-address, Q-legal answered
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** [Login.dc.html](../../ui/Login/Login.dc.html)

## Checklist

- [x] Replace `src/components/sign-in-page.tsx` with the mockup layout: illustration side (`aria-hidden`), logo link to `/`, `h1`, subtitle, white card with the button, a status region (`role="status"`), the "New here?" divider, the promises list and the footer line
- [x] Copy follows Q-copy-search, Q-copy-address and Q-legal
- [x] Use existing tokens and self-hosted fonts (ADR 0005); responsive at 768 and 375 px; reduced-motion support
- [x] Keep robots `noindex` in the route head
- [x] Do not build the mockup's "Continue to your dashboard (mockup)" shortcut

## Verification

- [x] Vitest: renders the `h1` "Welcome! Come on in.", the "Continue with Google" button, a "Back to home" link to `/` and the status region; the placeholder text is gone; the decorative section is `aria-hidden`
- [x] Manual: compare side by side with the mockup at 1440, 768 and 375 px, no horizontal scroll, no requests to Google Fonts

**Manual check (2026-11-27):** side-by-side screenshots of the mockup and dev `/sign-in` at 1440, 768 and 375 px; no horizontal scroll, no Google Fonts requests. The product owner accepted the differences listed in the [feature delivery notes](../../features/google-sign-in.md#delivery-notes).
