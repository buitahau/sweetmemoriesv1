# SweetMemories

SweetMemories lets people turn memories (a person, an event, a first day) into small public web pages.

Each user gets a subdomain:

- `john.sweetmemories.com` is the user's home page.
- `john.sweetmemories.com/alice` is a memory page.

**Flow:** sign in with Google → choose a template → add photos and text → publish.

Memories are fully public. Only an admin reviews templates before they go live.

## Status

**Design phase only.** All screens exist as mockups on one canvas. A first backend draft exists but is parked and untouched until the design is approved. No application code is part of this repository yet.

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

Not yet established. This will be filled in once the design is approved and implementation begins.
