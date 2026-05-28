# SERP Project Notes

This is a local SERP/page analysis toolset. It is an ongoing project, so treat the current code as the source of truth instead of assuming a fixed roadmap.

## Stack

- Next.js `16.2.6` App Router with React `19`.
- TypeScript, Tailwind CSS v4, shadcn/base UI conventions.
- Vitest for library tests.
- Chrome extension in `extension/` posts page captures to the local app.

Before changing Next.js routing, route handlers, params, server/client components, or config, read the matching guide in `node_modules/next/dist/docs/`. This project is on a newer Next version where some APIs differ from older examples.

## Main Structure

- `app/layout.tsx` is the root app shell and metadata.
- `app/(app)/layout.tsx` provides the in-app header/sidebar layout. The `(app)` route group does not appear in URLs.
- `app/(app)/page.tsx` is the minimal home screen.
- `app/(app)/page-overview/page.tsx` is a client page for manually analyzing a URL through `/api/analyze` and exporting results.
- `app/(app)/page-outline-collector/page.tsx` is a client page for reviewing captures received from the Chrome extension.
- `app/api/analyze/route.ts` fetches a submitted URL, checks robots/security/basic blocking cases, parses HTML, and returns a `PageResult`.
- `app/api/captures/route.ts` lists and creates extension captures.
- `app/api/captures/[id]/route.ts` patches and deletes saved captures. Dynamic route params are async in this Next version.
- `components/` contains shared UI for the app screens; `components/ui/` is the shadcn-style primitive area.
- `lib/` contains shared logic and types:
  - `parser.ts`: Cheerio HTML parsing for title, meta, headings, schema, links, excerpt, word count.
  - `robots.ts`: robots.txt checks.
  - `captures-store.ts`: JSON-file persistence for captures.
  - `export.ts`: JSON/CSV/Markdown exporters.
  - `types.ts`: `PageResult`, `Capture`, and related shared types.
- `lib/__tests__/` covers parser, robots, capture, and export helpers.
- `data/captures.json` is local persisted capture data. Do not treat it as schema source; use `lib/types.ts`.
- `extension/` is a Manifest V3 Chrome extension. `popup.js` extracts data from the active tab and posts to `http://localhost:3000/api/captures`.
- `docs/superpowers/` contains older design/planning notes. Useful background only; current code wins.

## Development Commands

- `npm run dev` starts the local Next app, normally at `http://localhost:3000`.
- `npm run build` builds the app.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest.

## Working Conventions

- Keep changes small and aligned with the existing simple structure.
- Put browser-interactive UI in client components with `'use client'`; keep parsing, robots, export, and storage logic in `lib/`.
- Keep API responses shaped by `lib/types.ts`.
- Preserve the local-only nature of the tool unless explicitly asked to make it production-ready.
- Be careful with `data/captures.json`; it may contain real working research data.
