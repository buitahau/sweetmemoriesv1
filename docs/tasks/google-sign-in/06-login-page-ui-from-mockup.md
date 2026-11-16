# 06 Login page UI from mockup (idle state)

**Status:** todo
**Side:** front-end
**Size:** M
**Dependencies:** none (can start now). Copy questions Q-copy-search, Q-copy-address, Q-legal answered
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** [Login.dc.html](../../ui/Login/Login.dc.html)

## Checklist

- [ ] Replace `src/components/sign-in-page.tsx` with the mockup layout: illustration side (`aria-hidden`), logo link to `/`, `h1`, subtitle, white card with the button, a status region (`role="status"`), the "New here?" divider, the promises list and the footer line
- [ ] Copy follows Q-copy-search, Q-copy-address and Q-legal
- [ ] Use existing tokens and self-hosted fonts (ADR 0005); responsive at 768 and 375 px; reduced-motion support
- [ ] Keep robots `noindex` in the route head
- [ ] Do not build the mockup's "Continue to your dashboard (mockup)" shortcut

## Verification

- [ ] Vitest: renders the `h1` "Welcome! Come on in.", the "Continue with Google" button, a "Back to home" link to `/` and the status region; the placeholder text is gone; the decorative section is `aria-hidden`
- [ ] Manual: compare side by side with the mockup at 1440, 768 and 375 px, no horizontal scroll, no requests to Google Fonts
