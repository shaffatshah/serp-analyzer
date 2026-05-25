# SERP Page Overview Tool — Design Spec
Date: 2026-05-25

## Purpose

A local Next.js web app for editorial research. The user manually pastes URLs from Google search results one at a time. The app fetches each page once, extracts structured metadata and heading structure, and lets the user compare and export results. Not a crawler, rank tracker, or content-copying tool.

---

## Architecture

Single-page Next.js 16 app running locally at `localhost:3000`. All state lives in React — no database, no persistence between sessions. A page refresh resets everything.

```
[Browser UI]
    ↓ POST /api/analyze { url }
[Next.js API Route]
    1. Validate URL
    2. Fetch robots.txt → check path allowance
    3. Fetch target URL (one request, custom User-Agent)
    4. Parse static HTML with cheerio
    5. Return structured JSON
    ↓
[React state] → result cards rendered in list
    ↓ user clicks export
[Client-side file download] → .md / .csv / .json
```

**User-Agent:** `AsiaLongStay-SERP-Research/1.0 (local research tool; not a crawler)`

---

## API Route: `POST /api/analyze`

**Input:** `{ url: string }`

**Sequence:**

1. Validate URL — must be http/https, not a Google domain.
2. Fetch `robots.txt` from domain root. Parse against User-Agent and target path. If disallowed → return `robots_disallowed`, stop.
3. Fetch target URL with 10-second timeout.
   - Non-200 status → `fetch_failed`
   - Non-HTML Content-Type → `unsupported_content_type`
   - CAPTCHA/challenge signals (short body + known patterns) → `captcha_or_challenge`
   - Login redirect or login form signals (URL contains `/login`, `/signin`, or body contains login form) → `login_required`
4. Parse with cheerio. If extracted visible text is under ~100 words → flag as `js_rendered_incomplete`.
5. Return structured `PageResult` JSON.

**No retry.** One attempt per submission. If blocked, UI instructs user to extract manually.

**Status values:** `ok | robots_disallowed | captcha_or_challenge | login_required | js_rendered_incomplete | fetch_failed | unsupported_content_type`

---

## Data Model

```ts
type PageResult = {
  id: string                    // crypto.randomUUID()
  url: string
  domain: string
  httpStatus: number | null
  fetchedAt: string             // ISO timestamp
  status: PageStatus
  title: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  robotsMeta: string | null
  headingOutline: { level: 1 | 2 | 3 | 4; text: string }[]
  excerpt: string | null        // max 200 words
  wordCount: number | null
  schemaTypes: string[]
  internalLinkCount: number | null
  externalLinkCount: number | null
  // user-entered fields
  keyword: string
  serpPosition: string
  notes: string
}
```

---

## UI Layout

Single page, top-to-bottom:

```
┌─────────────────────────────────────┐
│  URL Input bar                      │
│  [paste URL here...] [Analyze]      │
│  Optional: Keyword __ Position __   │
├─────────────────────────────────────┤
│  Export: [MD] [CSV] [JSON]          │
│  (disabled when list is empty)      │
├─────────────────────────────────────┤
│  Result cards (most recent on top)  │
│  ┌───────────────────────────────┐  │
│  │ domain.com · 200 · 2s ago     │  │
│  │ [Metadata ▾]  (expanded)      │  │
│  │   title, meta desc, canonical,│  │
│  │   robots meta, schema, links, │  │
│  │   word count, keyword, pos,   │  │
│  │   user notes (textarea)       │  │
│  │ [Heading outline ▾] (expanded)│  │
│  │   H1 ─ Title here             │  │
│  │     H2 ─ Section one          │  │
│  │       H3 ─ Subsection         │  │
│  │     H2 ─ Section two          │  │
│  │ [Excerpt ▾]  (expanded)       │  │
│  │   First 200 words of text...  │  │
│  │                    [Remove]   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

- All three sections (Metadata, Heading outline, Excerpt) expanded by default, individually collapsible.
- Blocked/failed results show as a card with status displayed prominently — no metadata sections rendered.
- Each card has a Remove button to delete it from the session.

---

## Export

All exports are client-side file downloads — no server involvement.

| Format | Detail |
|--------|--------|
| JSON | Full array of `PageResult` objects |
| CSV | One row per result; `headingOutline` flattened to pipe-separated string |
| Markdown | One `##` section per result with metadata table + heading outline as nested list |

---

## Fetch Rules

- Fetch only URLs manually pasted by the user
- Check robots.txt before fetching
- One request per URL, no retry
- No proxy rotation, CAPTCHA bypass, header spoofing, or browser impersonation
- Do not scrape Google search result pages
- Do not store full competitor article text

---

## Non-Goals (v1)

- No persistence between sessions
- No page type auto-detection
- No AI writing or rewriting
- No automated Google scraping
- No rank tracking
- No full-site crawling
