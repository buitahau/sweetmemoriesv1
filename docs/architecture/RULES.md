# Rules

Rules every change must follow. Architecture overview: [ARCHITECTURE.md](ARCHITECTURE.md).

## Security (non-negotiable)

Templates and custom blocks run admin-authored CSS/JS on public pages, so:

1. Public memory pages are served **without login cookies** (separate origin/cookie scope from the app and admin).
2. Each block's CSS is **scoped** to that block.
3. Block and template scripts are **checked** before acceptance.
4. Templates go through the **review queue** before going live; never bypass it.
5. Memories are public by design, so never put private user data in memory page output.
6. Validate and sanitize slugs (reserved words, uniqueness per user) and uploads (type, size).

## Conventions

- Wizard steps always provide Back, Next and Save; Publish appears only on the last step of a draft.
- Keep the admin template builder split into three pages (details, wrapper, blocks), one open section at a time.
- Use domain terms (User, Memory, Template, Block, Photo) consistently in code, schema and UI copy.
- Keep changes small and focused.
- Ask before making architecture changes that contradict the stack in [ARCHITECTURE.md](ARCHITECTURE.md).

## Process

- Every change goes on its own branch from a fresh `dev-v2` and lands through a PR (`git-workflow` skill). Never commit directly to `dev-v2` or `main`.
- Project documents live under `docs/`; load the `docs-placement` skill before creating, moving or updating one.
