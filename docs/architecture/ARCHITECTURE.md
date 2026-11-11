# Architecture

How SweetMemories fits together. Single trade-offs live in `../adr/`, setup steps in `../infra/`.

## Product

SweetMemories turns memories (a person, an event, a first day) into small public web pages.

**Flow:** sign in with Google → choose a template → add photos and text → publish.

## Stack

| Concern | Choice |
| --- | --- |
| Front-end and backend | TanStack Start |
| Styling / components | Tailwind CSS + shadcn/ui |
| Database | Neon / Postgres |
| Photo storage | S3 |
| Auth | Better Auth, Google sign-in |

Ask before making architecture changes that contradict this stack.

## Domains and URLs

Each user owns a subdomain.

- `john.sweetmemories.com` is the user's home page.
- `john.sweetmemories.com/alice` is a memory page.

Three surfaces, each with its own cookie scope:

| Surface | Audience | Cookies |
| --- | --- | --- |
| App | Signed-in users (wizard, photo picker) | Login cookies |
| Admin | Admin (template builder, review queue) | Login cookies |
| Public memory pages | Everyone | **None**: separate origin / cookie scope |

## Domain model

- **User**: signs in with Google; owns a subdomain.
- **Memory**: public page at `<subdomain>/<slug>`; created from a template via the wizard; draft or published.
- **Template**: a set of blocks plus a wrapper (classes, CSS, script). Admin-authored. Must pass admin review before users can use it.
- **Block**: a unit of content. Built-in types: Text, Timeline, Gallery, Carousel, 3×3 Photo Grid. Custom blocks define fields, markup, style and script. Every block may carry extra classes, CSS and a script.
- **Photo**: uploaded to S3 and picked through the photo picker.

Use these terms consistently in code, schema and UI copy.

## Key flows

- **Wizard**: pick an approved template, fill block fields, add photos, save as draft, publish on the last step.
- **Template builder (admin)**: three pages (details, wrapper, blocks), one open section at a time. Submitted templates enter the review queue and go live only after approval.
- **Public render**: the memory page is rendered from its template and blocks on the cookie-free origin, with each block's CSS scoped to that block.

## Related

- Rules every change must follow: [RULES.md](RULES.md)
- Features: `../features/`, decisions: `../adr/`
