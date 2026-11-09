# SweetMemories

SweetMemories lets people turn memories (a person, an event, a first day) into small public web pages.

Each user gets a subdomain:

- `john.sweetmemories.com` is the user's home page.
- `john.sweetmemories.com/alice` is a memory page.

**Flow:** sign in with Google → choose a template → add photos and text → publish.

Memories are fully public. Only an admin reviews templates before they go live.

## Status

**Design phase only.** All screens exist as mockups on one canvas. A first backend draft exists but is parked and untouched until the design is approved. The repository contains a skeleton only: an API with a health check and a web app with a placeholder home page.

## Tech stack (chosen)

| Concern | Choice |
| --- | --- |
| Frontend | React |
| Database | Neon (Postgres) |
| File storage | S3 |
| Auth | Better Auth (Google sign-in) |
| Backend | Node |

## Screens

### Public
- Homepage
- Sample memory page ("Mia, one to ten")

### User dashboard
- Memories
- Templates (each with "Use this template")
- Settings

### Memory wizard
Step-by-step flow with a live preview on the right. Every step has **Back**, **Next** and **Save**; drafts also get **Publish** on the last step.

- **Address step:** user picks the memory's sub-slug.
- **Block steps:** text, timeline (one photo per stop), gallery, carousel, 3×3 photo grid. Each photo picker has auto-scrolling pages and uploads.
- **Review step:** final check before publishing.

### Admin
- **Template builder** (three pages, one section open at a time):
  1. Template details: name, description, thumbnail
  2. Template wrapper: classes, CSS, script
  3. Blocks
- **Block settings:** built-in blocks (Text, Carousel, Gallery) are configured inside the Blocks section. Every block can also have extra classes, CSS and a script.
- **Custom block editor:** for complex blocks (e.g. a curved timeline). The admin defines fields, markup, style and script.
- **Review queue:** templates are checked here before going live.

## Security safeguards (from design review)

Because templates and custom blocks carry admin-authored CSS and scripts on public pages:

1. Serve user pages without login cookies (separate cookie scope/origin from the app).
2. Scope each block's CSS so it cannot leak into other blocks or the page shell.
3. Check scripts before they are accepted.
4. Keep admin review before any template is published.

## Repository layout

```
apps/api   Node, Express 5, GET /api/health
apps/web   React, Vite, home page
docs/      documentation
```

Prerequisite: Node 24 (`.nvmrc`).

Run these from the repository root:

| Command | Does |
|---|---|
| `npm install` | Installs all workspaces. |
| `npm run dev` | Starts API and web together. |
| `npm run build` | Builds every workspace. |
| `npm test` | Runs Vitest once in every workspace. |
| `npm run typecheck` | Type-checks every workspace. |
| `npm start -w apps/api` | Runs the built API. |

Local URLs:

- API: `http://localhost:3000`
- Web: `http://localhost:5173`
- Web preview of the build (`npm run preview -w apps/web`): `http://localhost:4173`

More detail: [docs/infra/local-development.md](docs/infra/local-development.md).
