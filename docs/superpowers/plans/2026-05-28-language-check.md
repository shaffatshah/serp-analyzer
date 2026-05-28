# Language Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side Language Check tool inside the serp app that scans pasted Markdown articles for vocabulary flags, overused words, AI-style phrases, repeated patterns, and weak section closings, then produces a copyable Markdown report.

**Architecture:** All scanner logic lives in `features/language-check/lib/` as pure functions tested with Vitest. Rules are stored as JSON files in `features/language-check/rules/`. The page is a client component that calls `runLanguageCheck()` in the browser and renders grouped results plus a copyable Markdown report.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, Vitest. No API route, no database, no LLM. JSON imports via `resolveJsonModule: true` (already in tsconfig).

---

## File Map

**New files:**
- `features/language-check/lib/types.ts` — all shared types (kept in lib/ to avoid generic types.ts files multiplying at the feature root)
- `features/language-check/rules/vocabulary-always.json`
- `features/language-check/rules/vocabulary-living-insights.json`
- `features/language-check/rules/overuse-words.json`
- `features/language-check/rules/ai-patterns.json`
- `features/language-check/rules/phrase-families.json`
- `features/language-check/rules/closing-patterns.json`
- `features/language-check/rules/abstract-wording.json`
- `features/language-check/rules/whitelist.json`
- `features/language-check/lib/parseMarkdown.ts` — uses remark AST to parse markdown into sections and sentences (no custom regex markdown stripper)
- `features/language-check/lib/scanVocabulary.ts` — exact word/phrase matches against vocabulary rules
- `features/language-check/lib/scanOveruse.ts` — counts words and flags when over limit
- `features/language-check/lib/scanAiPatterns.ts` — detects AI-style phrases
- `features/language-check/lib/scanPhraseFamily.ts` — regex-based phrase family detection
- `features/language-check/lib/scanSentenceStarters.ts` — counts repeated 2-word and 3-word sentence starters
- `features/language-check/lib/scanHeadingRestatement.ts` — flags high word-overlap between a heading and its first sentence
- `features/language-check/lib/scanClosings.ts` — flags tidy/weak section endings
- `features/language-check/lib/scanAbstractWording.ts` — counts abstract/formal words
- `features/language-check/lib/runLanguageCheck.ts` — orchestrates all scanners
- `features/language-check/lib/createMarkdownReport.ts` — produces the copyable Markdown report
- `features/language-check/lib/__tests__/parseMarkdown.test.ts`
- `features/language-check/lib/__tests__/scanVocabulary.test.ts`
- `features/language-check/lib/__tests__/scanOveruse.test.ts`
- `features/language-check/lib/__tests__/scanAiPatterns.test.ts`
- `features/language-check/lib/__tests__/scanPhraseFamily.test.ts`
- `features/language-check/lib/__tests__/scanSentenceStarters.test.ts`
- `features/language-check/lib/__tests__/scanHeadingRestatement.test.ts`
- `features/language-check/lib/__tests__/scanClosings.test.ts`
- `features/language-check/lib/__tests__/scanAbstractWording.test.ts`
- `features/language-check/lib/__tests__/runLanguageCheck.test.ts`
- `features/language-check/components/LanguageCheckForm.tsx`
- `features/language-check/components/LanguageCheckResults.tsx`
- `features/language-check/components/ReportPreview.tsx`
- `app/(app)/language-check/page.tsx`

**Modified files:**
- `components/Sidebar.tsx` — add Language Check nav item

---

## Task 1: Types + Sidebar + Route Shell

**Files:**
- Create: `features/language-check/lib/types.ts`
- Modify: `components/Sidebar.tsx`
- Create: `app/(app)/language-check/page.tsx`

- [ ] **Step 1: Create types file**

```ts
// features/language-check/lib/types.ts

export type ArticleType = 'procedure' | 'living-insights' | 'living-cost'

export type FindingCategory =
  | 'vocabulary'
  | 'overuse'
  | 'ai-pattern'
  | 'sentence-starter'
  | 'heading-restatement'
  | 'tidy-closing'
  | 'phrase-family'
  | 'abstract-wording'

export type Severity = 'high' | 'medium' | 'low'

export type Finding = {
  id: string
  category: FindingCategory
  severity: Severity
  section?: string
  matchedText: string
  surroundingText?: string
  reason?: string
  replacementHint?: string
  count?: number
  limit?: number
}

export type CheckSummary = {
  totalFindings: number
  high: number
  medium: number
  low: number
}

export type CheckResult = {
  summary: CheckSummary
  findings: Finding[]
  markdownReport: string
}
```

- [ ] **Step 2: Add Language Check to sidebar**

In `components/Sidebar.tsx`, add `{ label: 'Language Check', href: '/language-check' }` to the `NAV` array:

```ts
const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Page Overview', href: '/page-overview' },
  { label: 'Page Outline Collector', href: '/page-outline-collector' },
  { label: 'Language Check', href: '/language-check' },
]
```

- [ ] **Step 3: Create the route page shell**

```tsx
// app/(app)/language-check/page.tsx
export default function LanguageCheckPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Language Check</h1>
      <p className="text-sm text-muted-foreground">
        Scan an article for vocabulary flags, AI-style phrasing, repeated patterns, and weak section endings.
      </p>
      <p className="text-sm text-muted-foreground">Coming soon…</p>
    </div>
  )
}
```

- [ ] **Step 4: Verify build passes**

Run from `/Users/shaft/Desktop/serp`:
```bash
npm run build
```
Expected: exits 0, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/types.ts components/Sidebar.tsx app/\(app\)/language-check/page.tsx
git commit -m "feat: scaffold language-check route and types"
```

---

## Task 2: Rule JSON Files

**Files:**
- Create: `features/language-check/rules/vocabulary-always.json`
- Create: `features/language-check/rules/vocabulary-living-insights.json`
- Create: `features/language-check/rules/overuse-words.json`
- Create: `features/language-check/rules/ai-patterns.json`
- Create: `features/language-check/rules/phrase-families.json`
- Create: `features/language-check/rules/closing-patterns.json`
- Create: `features/language-check/rules/abstract-wording.json`
- Create: `features/language-check/rules/whitelist.json`

- [ ] **Step 1: Create vocabulary-always.json**

```json
[
  { "id": "vocab_001", "phrase": "leverage", "matchType": "word", "severity": "high", "replacementHint": "use, rely on", "enabled": true },
  { "id": "vocab_002", "phrase": "utilize", "matchType": "word", "severity": "high", "replacementHint": "use", "enabled": true },
  { "id": "vocab_003", "phrase": "navigating", "matchType": "word", "severity": "high", "replacementHint": "handling, working through, dealing with", "enabled": true },
  { "id": "vocab_004", "phrase": "navigate", "matchType": "word", "severity": "high", "replacementHint": "handle, work through, deal with", "enabled": true },
  { "id": "vocab_005", "phrase": "daunting", "matchType": "word", "severity": "high", "replacementHint": "difficult, complicated, hard", "enabled": true },
  { "id": "vocab_006", "phrase": "seamlessly", "matchType": "word", "severity": "high", "replacementHint": "easily, without issues, without problems", "enabled": true },
  { "id": "vocab_007", "phrase": "seamless", "matchType": "word", "severity": "high", "replacementHint": "smooth, easy, simple", "enabled": true },
  { "id": "vocab_008", "phrase": "empower", "matchType": "word", "severity": "high", "replacementHint": "allow, help, let, give", "enabled": true },
  { "id": "vocab_009", "phrase": "streamline", "matchType": "word", "severity": "high", "replacementHint": "simplify, speed up, reduce steps in", "enabled": true },
  { "id": "vocab_010", "phrase": "robust", "matchType": "word", "severity": "high", "replacementHint": "strong, reliable, stable", "enabled": true },
  { "id": "vocab_011", "phrase": "comprehensive", "matchType": "word", "severity": "medium", "replacementHint": "complete, full, detailed", "enabled": true },
  { "id": "vocab_012", "phrase": "cutting-edge", "matchType": "phrase", "severity": "high", "replacementHint": "newest, latest, most recent", "enabled": true },
  { "id": "vocab_013", "phrase": "holistic", "matchType": "word", "severity": "high", "replacementHint": "full, complete, overall", "enabled": true },
  { "id": "vocab_014", "phrase": "paramount", "matchType": "word", "severity": "high", "replacementHint": "most important, critical, essential", "enabled": true },
  { "id": "vocab_015", "phrase": "it's important to note", "matchType": "phrase", "severity": "high", "replacementHint": "rewrite as a direct statement", "enabled": true },
  { "id": "vocab_016", "phrase": "in conclusion", "matchType": "phrase", "severity": "high", "replacementHint": "remove or rewrite as a direct statement", "enabled": true },
  { "id": "vocab_017", "phrase": "a wide range of", "matchType": "phrase", "severity": "high", "replacementHint": "many, various, several", "enabled": true },
  { "id": "vocab_018", "phrase": "whether you're a", "matchType": "phrase", "severity": "high", "replacementHint": "remove, start with the direct point", "enabled": true },
  { "id": "vocab_019", "phrase": "delve", "matchType": "word", "severity": "high", "replacementHint": "look at, examine, explore", "enabled": true },
  { "id": "vocab_020", "phrase": "synergy", "matchType": "word", "severity": "high", "replacementHint": "describe the actual benefit directly", "enabled": true }
]
```

- [ ] **Step 2: Create vocabulary-living-insights.json**

```json
[
  { "id": "vocab_li_001", "phrase": "framework", "matchType": "word", "severity": "high", "replacementHint": "system, rules, setup, structure", "enabled": true },
  { "id": "vocab_li_002", "phrase": "landscape", "matchType": "word", "severity": "high", "replacementHint": "situation, options, market, range", "enabled": true },
  { "id": "vocab_li_003", "phrase": "infrastructure", "matchType": "word", "severity": "medium", "replacementHint": "roads, services, systems, networks", "enabled": true },
  { "id": "vocab_li_004", "phrase": "footprint", "matchType": "word", "severity": "medium", "replacementHint": "presence, size, coverage, reach", "enabled": true },
  { "id": "vocab_li_005", "phrase": "bandwidth", "matchType": "word", "severity": "high", "replacementHint": "capacity, time, speed, ability", "enabled": true },
  { "id": "vocab_li_006", "phrase": "onboarding", "matchType": "word", "severity": "medium", "replacementHint": "getting started, signing up, setting up", "enabled": true }
]
```

- [ ] **Step 3: Create overuse-words.json**

```json
[
  { "id": "overuse_001", "word": "typically", "limit": 2, "severity": "medium", "replacementHint": "usually, or state the pattern directly", "enabled": true },
  { "id": "overuse_002", "word": "generally", "limit": 2, "severity": "medium", "replacementHint": "usually, in most cases, or state directly", "enabled": true },
  { "id": "overuse_003", "word": "essentially", "limit": 2, "severity": "medium", "replacementHint": "remove or rewrite as a direct statement", "enabled": true },
  { "id": "overuse_004", "word": "importantly", "limit": 2, "severity": "medium", "replacementHint": "remove — let the point speak for itself", "enabled": true },
  { "id": "overuse_005", "word": "however", "limit": 3, "severity": "low", "replacementHint": "but, or restructure the sentence", "enabled": true },
  { "id": "overuse_006", "word": "therefore", "limit": 2, "severity": "low", "replacementHint": "so, which means, or rewrite as a direct consequence", "enabled": true },
  { "id": "overuse_007", "word": "simply", "limit": 2, "severity": "medium", "replacementHint": "remove — the simplicity should be implied", "enabled": true },
  { "id": "overuse_008", "word": "straightforward", "limit": 2, "severity": "medium", "replacementHint": "simple, clear, easy, or describe what makes it so", "enabled": true }
]
```

- [ ] **Step 4: Create ai-patterns.json**

```json
[
  { "id": "ai_001", "pattern": "can feel overwhelming", "severity": "high", "reason": "AI-style soft opener", "enabled": true },
  { "id": "ai_002", "pattern": "plays a crucial role", "severity": "high", "reason": "AI editorial filler", "enabled": true },
  { "id": "ai_003", "pattern": "at the end of the day", "severity": "high", "reason": "AI-style closing phrase", "enabled": true },
  { "id": "ai_004", "pattern": "it is worth noting", "severity": "high", "reason": "AI-style hedge opener", "enabled": true },
  { "id": "ai_005", "pattern": "needless to say", "severity": "high", "reason": "AI editorial filler", "enabled": true },
  { "id": "ai_006", "pattern": "as mentioned earlier", "severity": "medium", "reason": "AI structural cue", "enabled": true },
  { "id": "ai_007", "pattern": "as mentioned above", "severity": "medium", "reason": "AI structural cue", "enabled": true },
  { "id": "ai_008", "pattern": "it goes without saying", "severity": "high", "reason": "AI editorial filler", "enabled": true },
  { "id": "ai_009", "pattern": "in today's world", "severity": "high", "reason": "AI opener cliché", "enabled": true },
  { "id": "ai_010", "pattern": "in the modern world", "severity": "high", "reason": "AI opener cliché", "enabled": true },
  { "id": "ai_011", "pattern": "this guide will", "severity": "medium", "reason": "AI meta-commentary opener", "enabled": true },
  { "id": "ai_012", "pattern": "in this article", "severity": "medium", "reason": "AI meta-commentary opener", "enabled": true },
  { "id": "ai_013", "pattern": "key takeaway", "severity": "medium", "reason": "AI structural label", "enabled": true },
  { "id": "ai_014", "pattern": "in summary", "severity": "medium", "reason": "AI summary opener", "enabled": true },
  { "id": "ai_015", "pattern": "it is important to understand", "severity": "high", "reason": "AI-style hedge opener", "enabled": true }
]
```

- [ ] **Step 5: Create phrase-families.json**

```json
[
  {
    "id": "phrase_001",
    "label": "worth + verb",
    "pattern": "\\bworth\\s+(checking|confirming|asking|knowing|understanding|considering|verifying|exploring|reviewing)\\b",
    "severity": "medium",
    "reason": "Repeated 'worth + verb' phrasing can create an AI-style editorial cadence.",
    "enabled": true
  },
  {
    "id": "phrase_002",
    "label": "practical + noun",
    "pattern": "\\bpractical\\s+(answer|takeaway|pattern|setup|note|consequence|reality|guide|tip|advice|option)\\b",
    "severity": "medium",
    "reason": "Repeated 'practical + noun' phrasing can sound formulaic.",
    "enabled": true
  },
  {
    "id": "phrase_003",
    "label": "what this means",
    "pattern": "\\bwhat this means\\b",
    "severity": "medium",
    "reason": "Repeated 'what this means' framing creates an AI-style explanatory cadence.",
    "enabled": true
  },
  {
    "id": "phrase_004",
    "label": "one thing to note",
    "pattern": "\\bone thing to note\\b",
    "severity": "medium",
    "reason": "Formulaic AI-style qualifier.",
    "enabled": true
  },
  {
    "id": "phrase_005",
    "label": "the key + noun",
    "pattern": "\\bthe key\\s+(limitation|difference|point|thing|factor|consideration|requirement|step|issue|question)\\b",
    "severity": "low",
    "reason": "Repeated 'the key + noun' framing can create a formulaic editorial tone.",
    "enabled": true
  },
  {
    "id": "phrase_006",
    "label": "in most cases",
    "pattern": "\\bin most cases\\b",
    "severity": "low",
    "reason": "Vague qualifier. Often clearer to state the actual pattern or percentage.",
    "enabled": true
  }
]
```

- [ ] **Step 6: Create closing-patterns.json**

```json
[
  { "id": "closing_001", "pattern": "the best option depends", "severity": "medium", "reason": "tidy summary closing", "enabled": true },
  { "id": "closing_002", "pattern": "the right choice depends", "severity": "medium", "reason": "tidy summary closing", "enabled": true },
  { "id": "closing_003", "pattern": "it depends on your", "severity": "medium", "reason": "tidy summary closing", "enabled": true },
  { "id": "closing_004", "pattern": "the answer varies", "severity": "medium", "reason": "tidy summary closing", "enabled": true },
  { "id": "closing_005", "pattern": "it varies by", "severity": "medium", "reason": "tidy summary closing", "enabled": true },
  { "id": "closing_006", "pattern": "the key takeaway", "severity": "medium", "reason": "AI-style section summary label", "enabled": true },
  { "id": "closing_007", "pattern": "keep this in mind", "severity": "medium", "reason": "tidy reminder closing", "enabled": true },
  { "id": "closing_008", "pattern": "as always", "severity": "low", "reason": "filler transition closing", "enabled": true },
  { "id": "closing_009", "pattern": "ultimately, the decision", "severity": "medium", "reason": "tidy summary closing", "enabled": true },
  { "id": "closing_010", "pattern": "overall, the", "severity": "low", "reason": "tidy summary opening word", "enabled": true }
]
```

- [ ] **Step 7: Create abstract-wording.json**

```json
[
  { "id": "abstract_001", "word": "friction", "severity": "medium", "reason": "Abstract wording. May be clearer if replaced with the actual problem.", "enabled": true },
  { "id": "abstract_002", "word": "ecosystem", "severity": "medium", "reason": "Abstract wording. Often clearer as system, setup, apps, banks, or services.", "enabled": true },
  { "id": "abstract_003", "word": "trajectory", "severity": "medium", "reason": "Abstract wording. Often clearer as direction, path, or rate of change.", "enabled": true },
  { "id": "abstract_004", "word": "nuance", "severity": "medium", "reason": "Abstract wording. Usually clearer if replaced with the specific detail.", "enabled": true },
  { "id": "abstract_005", "word": "paradigm", "severity": "high", "reason": "Abstract wording. Usually clearer as approach, method, model, or system.", "enabled": true },
  { "id": "abstract_006", "word": "overhead", "severity": "low", "reason": "Abstract wording. Often clearer as extra cost, extra steps, or extra time.", "enabled": true },
  { "id": "abstract_007", "word": "scalability", "severity": "medium", "reason": "Abstract wording. Often clearer as ability to grow, handles more users, or scales up.", "enabled": true },
  { "id": "abstract_008", "word": "granular", "severity": "medium", "reason": "Abstract wording. Usually clearer as detailed, specific, or broken down.", "enabled": true }
]
```

- [ ] **Step 8: Create whitelist.json**

```json
[
  "TRC",
  "Temporary Residence Card",
  "SRRV",
  "KITAS",
  "TM30",
  "ACR I-Card",
  "Non-OA",
  "Non-B",
  "Non-O",
  "e-visa",
  "METV",
  "BOI",
  "MICE",
  "IGDS",
  "60-day",
  "90-day",
  "30-day"
]
```

- [ ] **Step 9: Commit**

```bash
git add features/language-check/rules/
git commit -m "feat: add language-check rule JSON files"
```

---

## Task 3: parseMarkdown

**Files:**
- Create: `features/language-check/lib/parseMarkdown.ts`
- Create: `features/language-check/lib/__tests__/parseMarkdown.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/parseMarkdown.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'

const MD = `
## Banking in Vietnam

Opening a bank account here is simpler than most people expect. You need a passport and a visa. Most banks accept short-stay visas.

### Which banks accept foreigners

Vietcombank and Techcombank both accept foreigners with a standard tourist visa.

## ATM Fees

ATM fees vary by bank. Some banks charge flat fees.
`.trim()

describe('parseMarkdown', () => {
  it('extracts sections with headings', () => {
    const result = parseMarkdown(MD)
    expect(result.sections).toHaveLength(3)
    expect(result.sections[0].heading).toEqual({ level: 2, text: 'Banking in Vietnam' })
    expect(result.sections[1].heading).toEqual({ level: 3, text: 'Which banks accept foreigners' })
    expect(result.sections[2].heading).toEqual({ level: 2, text: 'ATM Fees' })
  })

  it('strips markdown syntax from rawText', () => {
    const result = parseMarkdown('## Section\n\nThis is **bold** and [a link](https://example.com).')
    expect(result.sections[0].rawText).toContain('bold')
    expect(result.sections[0].rawText).not.toContain('**')
    expect(result.sections[0].rawText).not.toContain('(https://')
  })

  it('produces allSentences from all sections', () => {
    const result = parseMarkdown(MD)
    expect(result.allSentences.length).toBeGreaterThan(3)
    expect(result.allSentences[0]).toContain('simpler than most people expect')
  })

  it('sets lastParagraph to the last paragraph in each section', () => {
    const result = parseMarkdown(MD)
    expect(result.sections[0].lastParagraph).toContain('short-stay visas')
  })

  it('handles article with no headings', () => {
    const result = parseMarkdown('Just a paragraph. Another sentence.')
    expect(result.sections).toHaveLength(1)
    expect(result.sections[0].heading).toBeNull()
  })
})
```

- [ ] **Step 2: Install remark packages**

```bash
cd /Users/shaft/Desktop/serp && npm install remark mdast-util-to-string
```
Expected: packages added to node_modules, no errors.

- [ ] **Step 3: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/parseMarkdown.test.ts
```
Expected: FAIL — `parseMarkdown` not found.

- [ ] **Step 4: Implement parseMarkdown.ts**

Use remark to produce an mdast AST. Walk the top-level nodes, group by H2/H3 headings, convert paragraph/list/blockquote nodes to plain text with `mdast-util-to-string`. This handles bold, links, code spans, tables, and fenced blocks correctly — no custom regex markdown stripper.

```ts
// features/language-check/lib/parseMarkdown.ts
import { remark } from 'remark'
import { toString } from 'mdast-util-to-string'
import type { Root, RootContent } from 'mdast'

export type ParsedSection = {
  heading: { level: 2 | 3; text: string } | null
  rawText: string
  sentences: string[]
  lastParagraph: string | null
}

export type ParsedArticle = {
  fullText: string
  sections: ParsedSection[]
  allSentences: string[]
}

const TEXT_NODE_TYPES = new Set(['paragraph', 'list', 'blockquote'])

function extractSentences(text: string): string[] {
  const result: string[] = []
  for (const para of text.split(/\n\n+/)) {
    const line = para.replace(/\n/g, ' ').trim()
    if (!line) continue
    const parts = line.split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    for (const part of parts) {
      const t = part.trim()
      if (t.length > 5) result.push(t)
    }
  }
  return result
}

export function parseMarkdown(markdown: string): ParsedArticle {
  const ast = remark().parse(markdown) as Root
  const sections: ParsedSection[] = []

  let currentHeading: { level: 2 | 3; text: string } | null = null
  let currentNodes: RootContent[] = []

  function flush() {
    const paragraphTexts = currentNodes
      .filter(n => TEXT_NODE_TYPES.has(n.type))
      .map(n => toString(n).trim())
      .filter(Boolean)

    const rawText = paragraphTexts.join('\n\n')
    const sentences = extractSentences(rawText)
    const lastParagraph = paragraphTexts.at(-1) ?? null

    sections.push({ heading: currentHeading, rawText, sentences, lastParagraph })
  }

  for (const node of ast.children) {
    if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
      if (currentNodes.length || currentHeading !== null) flush()
      currentHeading = { level: node.depth as 2 | 3, text: toString(node) }
      currentNodes = []
    } else {
      currentNodes.push(node)
    }
  }

  if (currentNodes.length || currentHeading !== null) flush()

  const allSentences = sections.flatMap(s => s.sentences)
  const fullText = sections.map(s => s.rawText).join('\n\n')

  return { fullText, sections, allSentences }
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/parseMarkdown.test.ts
```
Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add features/language-check/lib/parseMarkdown.ts features/language-check/lib/__tests__/parseMarkdown.test.ts package.json package-lock.json
git commit -m "feat: implement parseMarkdown using remark AST"
```

---

## Task 4: scanVocabulary

**Files:**
- Create: `features/language-check/lib/scanVocabulary.ts`
- Create: `features/language-check/lib/__tests__/scanVocabulary.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/scanVocabulary.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanVocabulary } from '../scanVocabulary'

describe('scanVocabulary', () => {
  it('flags a word from the always-list', () => {
    const article = parseMarkdown('## Section\n\nYou can leverage the system to get results.')
    const findings = scanVocabulary(article, 'procedure')
    expect(findings).toHaveLength(1)
    expect(findings[0].matchedText).toBe('leverage')
    expect(findings[0].category).toBe('vocabulary')
    expect(findings[0].severity).toBe('high')
    expect(findings[0].section).toBe('Section')
  })

  it('does not flag whitelisted terms', () => {
    const article = parseMarkdown('## Section\n\nThe TRC is the Temporary Residence Card.')
    const findings = scanVocabulary(article, 'procedure')
    expect(findings).toHaveLength(0)
  })

  it('applies living-insights vocab only for living-insights type', () => {
    const md = '## Section\n\nThe framework for healthcare here is complex.'
    const procedure = scanVocabulary(parseMarkdown(md), 'procedure')
    const li = scanVocabulary(parseMarkdown(md), 'living-insights')
    expect(procedure).toHaveLength(0)
    expect(li).toHaveLength(1)
    expect(li[0].matchedText).toBe('framework')
  })

  it('does not flag living-insights vocab for living-cost type', () => {
    const article = parseMarkdown('## Section\n\nThe framework for costs.')
    const findings = scanVocabulary(article, 'living-cost')
    expect(findings).toHaveLength(0)
  })

  it('flags a phrase match', () => {
    const article = parseMarkdown('## Section\n\nA wide range of options exist.')
    const findings = scanVocabulary(article, 'procedure')
    expect(findings.some(f => f.matchedText === 'a wide range of')).toBe(true)
  })

  it('includes a replacement hint', () => {
    const article = parseMarkdown('## Section\n\nThis is daunting for most people.')
    const findings = scanVocabulary(article, 'procedure')
    expect(findings[0].replacementHint).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/scanVocabulary.test.ts
```
Expected: FAIL — `scanVocabulary` not found.

- [ ] **Step 3: Implement scanVocabulary.ts**

```ts
// features/language-check/lib/scanVocabulary.ts
import type { ArticleType, Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import alwaysRules from '../rules/vocabulary-always.json'
import liRules from '../rules/vocabulary-living-insights.json'
import whitelist from '../rules/whitelist.json'

type VocabRule = {
  id: string
  phrase: string
  matchType: 'word' | 'phrase'
  severity: 'high' | 'medium' | 'low'
  replacementHint: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyWhitelist(text: string): string {
  let result = text
  for (const term of whitelist as string[]) {
    result = result.replace(
      new RegExp(escapeRegex(term), 'gi'),
      ' '.repeat(term.length)
    )
  }
  return result
}

function makePattern(phrase: string, matchType: 'word' | 'phrase'): RegExp {
  const esc = escapeRegex(phrase)
  return matchType === 'word'
    ? new RegExp(`\\b${esc}\\b`, 'gi')
    : new RegExp(esc, 'gi')
}

export function scanVocabulary(
  article: ParsedArticle,
  articleType: ArticleType,
): Finding[] {
  const rules: VocabRule[] = [
    ...(alwaysRules as VocabRule[]).filter(r => r.enabled),
    ...(articleType === 'living-insights'
      ? (liRules as VocabRule[]).filter(r => r.enabled)
      : []),
  ]

  const findings: Finding[] = []

  for (const section of article.sections) {
    const sectionLabel = section.heading?.text ?? 'Intro'
    const safeText = applyWhitelist(section.rawText)

    for (const rule of rules) {
      const pattern = makePattern(rule.phrase, rule.matchType)
      let match: RegExpExecArray | null
      while ((match = pattern.exec(safeText)) !== null) {
        const start = Math.max(0, match.index - 60)
        const end = Math.min(safeText.length, match.index + match[0].length + 60)
        findings.push({
          id: `vocab-${findings.length}`,
          category: 'vocabulary',
          severity: rule.severity,
          section: sectionLabel,
          matchedText: rule.phrase,
          surroundingText: section.rawText.slice(start, end),
          replacementHint: rule.replacementHint,
        })
      }
    }
  }

  return findings
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/scanVocabulary.test.ts
```
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/lib/scanVocabulary.ts features/language-check/lib/__tests__/scanVocabulary.test.ts
git commit -m "feat: implement scanVocabulary with whitelist and type-scoped rules"
```

---

## Task 5: scanOveruse

**Files:**
- Create: `features/language-check/lib/scanOveruse.ts`
- Create: `features/language-check/lib/__tests__/scanOveruse.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/scanOveruse.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanOveruse } from '../scanOveruse'

describe('scanOveruse', () => {
  it('flags a word that exceeds its limit', () => {
    const md = '## S\n\nTypically this. Typically that. Typically the other thing.'
    const findings = scanOveruse(parseMarkdown(md))
    expect(findings).toHaveLength(1)
    expect(findings[0].matchedText).toBe('typically')
    expect(findings[0].count).toBe(3)
    expect(findings[0].limit).toBe(2)
    expect(findings[0].category).toBe('overuse')
  })

  it('does not flag a word within its limit', () => {
    const md = '## S\n\nTypically this. Typically that.'
    const findings = scanOveruse(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('is case-insensitive', () => {
    const md = '## S\n\nTypically yes. TYPICALLY no. typically maybe.'
    const findings = scanOveruse(parseMarkdown(md))
    expect(findings[0].count).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/scanOveruse.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement scanOveruse.ts**

```ts
// features/language-check/lib/scanOveruse.ts
import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import overuseRules from '../rules/overuse-words.json'
import whitelist from '../rules/whitelist.json'

type OveruseRule = {
  id: string
  word: string
  limit: number
  severity: 'high' | 'medium' | 'low'
  replacementHint: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyWhitelist(text: string): string {
  let result = text
  for (const term of whitelist as string[]) {
    result = result.replace(
      new RegExp(escapeRegex(term), 'gi'),
      ' '.repeat(term.length)
    )
  }
  return result
}

export function scanOveruse(article: ParsedArticle): Finding[] {
  const rules = (overuseRules as OveruseRule[]).filter(r => r.enabled)
  const safeText = applyWhitelist(article.fullText)
  const findings: Finding[] = []

  for (const rule of rules) {
    const pattern = new RegExp(`\\b${escapeRegex(rule.word)}\\b`, 'gi')
    const matches = safeText.match(pattern)
    const count = matches?.length ?? 0
    if (count > rule.limit) {
      findings.push({
        id: `overuse-${findings.length}`,
        category: 'overuse',
        severity: rule.severity,
        matchedText: rule.word,
        replacementHint: rule.replacementHint,
        count,
        limit: rule.limit,
      })
    }
  }

  return findings
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/scanOveruse.test.ts
```
Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/lib/scanOveruse.ts features/language-check/lib/__tests__/scanOveruse.test.ts
git commit -m "feat: implement scanOveruse word frequency counter"
```

---

## Task 6: scanAiPatterns

**Files:**
- Create: `features/language-check/lib/scanAiPatterns.ts`
- Create: `features/language-check/lib/__tests__/scanAiPatterns.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/scanAiPatterns.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanAiPatterns } from '../scanAiPatterns'

describe('scanAiPatterns', () => {
  it('detects a known AI phrase', () => {
    const md = '## Intro\n\nThe process can feel overwhelming at first.'
    const findings = scanAiPatterns(parseMarkdown(md))
    expect(findings).toHaveLength(1)
    expect(findings[0].matchedText).toBe('can feel overwhelming')
    expect(findings[0].category).toBe('ai-pattern')
    expect(findings[0].section).toBe('Intro')
  })

  it('returns empty when no AI patterns present', () => {
    const md = '## Section\n\nThis is a plain sentence with no special phrases.'
    const findings = scanAiPatterns(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('includes surrounding context in surroundingText', () => {
    const md = '## S\n\nThis plays a crucial role in the process.'
    const findings = scanAiPatterns(parseMarkdown(md))
    expect(findings[0].surroundingText).toContain('plays a crucial role')
  })

  it('detects multiple occurrences across sections', () => {
    const md = '## A\n\nThis plays a crucial role.\n\n## B\n\nThis also plays a crucial role.'
    const findings = scanAiPatterns(parseMarkdown(md))
    expect(findings).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/scanAiPatterns.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement scanAiPatterns.ts**

```ts
// features/language-check/lib/scanAiPatterns.ts
import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import aiPatternRules from '../rules/ai-patterns.json'

type AiPatternRule = {
  id: string
  pattern: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function scanAiPatterns(article: ParsedArticle): Finding[] {
  const rules = (aiPatternRules as AiPatternRule[]).filter(r => r.enabled)
  const findings: Finding[] = []

  for (const section of article.sections) {
    const sectionLabel = section.heading?.text ?? 'Intro'
    for (const rule of rules) {
      const pattern = new RegExp(escapeRegex(rule.pattern), 'gi')
      let match: RegExpExecArray | null
      while ((match = pattern.exec(section.rawText)) !== null) {
        const start = Math.max(0, match.index - 60)
        const end = Math.min(section.rawText.length, match.index + match[0].length + 60)
        findings.push({
          id: `ai-${findings.length}`,
          category: 'ai-pattern',
          severity: rule.severity,
          section: sectionLabel,
          matchedText: rule.pattern,
          surroundingText: section.rawText.slice(start, end),
          reason: rule.reason,
        })
      }
    }
  }

  return findings
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/scanAiPatterns.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/lib/scanAiPatterns.ts features/language-check/lib/__tests__/scanAiPatterns.test.ts
git commit -m "feat: implement scanAiPatterns phrase detector"
```

---

## Task 7: scanPhraseFamily

**Files:**
- Create: `features/language-check/lib/scanPhraseFamily.ts`
- Create: `features/language-check/lib/__tests__/scanPhraseFamily.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/scanPhraseFamily.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanPhraseFamily } from '../scanPhraseFamily'

describe('scanPhraseFamily', () => {
  it('detects a worth+verb family match', () => {
    const md = '## S\n\nIt is worth checking the fees. It is also worth confirming the date.'
    const findings = scanPhraseFamily(parseMarkdown(md))
    const wordFamily = findings.find(f => f.matchedText === 'worth + verb')
    expect(wordFamily).toBeDefined()
    expect(wordFamily!.count).toBe(2)
    expect(wordFamily!.category).toBe('phrase-family')
  })

  it('includes examples in surroundingText', () => {
    const md = '## S\n\nIt is worth checking the fees.'
    const findings = scanPhraseFamily(parseMarkdown(md))
    const f = findings.find(f => f.matchedText === 'worth + verb')
    expect(f!.surroundingText).toContain('worth checking')
  })

  it('returns empty when no phrase families present', () => {
    const md = '## S\n\nThis is a plain sentence.'
    const findings = scanPhraseFamily(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('deduplicates examples in surroundingText', () => {
    const md = '## S\n\nWorth checking. Worth checking. Worth asking.'
    const findings = scanPhraseFamily(parseMarkdown(md))
    const f = findings.find(f => f.matchedText === 'worth + verb')!
    const examples = f.surroundingText!.split('; ')
    expect(new Set(examples).size).toBe(examples.length)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/scanPhraseFamily.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement scanPhraseFamily.ts**

```ts
// features/language-check/lib/scanPhraseFamily.ts
import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import phraseFamilyRules from '../rules/phrase-families.json'

type PhraseFamilyRule = {
  id: string
  label: string
  pattern: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  enabled: boolean
}

export function scanPhraseFamily(article: ParsedArticle): Finding[] {
  const rules = (phraseFamilyRules as PhraseFamilyRule[]).filter(r => r.enabled)
  const findings: Finding[] = []

  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern, 'gi')
    const matches: string[] = []
    let match: RegExpExecArray | null
    while ((match = pattern.exec(article.fullText)) !== null) {
      matches.push(match[0])
    }

    if (matches.length > 0) {
      const uniqueExamples = [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 5)
      findings.push({
        id: `phrase-${findings.length}`,
        category: 'phrase-family',
        severity: rule.severity,
        matchedText: rule.label,
        surroundingText: uniqueExamples.join('; '),
        reason: rule.reason,
        count: matches.length,
      })
    }
  }

  return findings
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/scanPhraseFamily.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/lib/scanPhraseFamily.ts features/language-check/lib/__tests__/scanPhraseFamily.test.ts
git commit -m "feat: implement scanPhraseFamily regex pattern detector"
```

---

## Task 8: scanSentenceStarters

**Files:**
- Create: `features/language-check/lib/scanSentenceStarters.ts`
- Create: `features/language-check/lib/__tests__/scanSentenceStarters.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/scanSentenceStarters.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanSentenceStarters } from '../scanSentenceStarters'

const REPEATED_MD = `
## Section

In practice, this works well. Another thing.
In practice, you will find it easy. Something else here.
In practice, the process is short. Final note.
This is one thing. This is another thing. This is a third thing.
`.trim()

describe('scanSentenceStarters', () => {
  it('flags a 2-word starter repeated 3 or more times (normalized, lowercase)', () => {
    const findings = scanSentenceStarters(parseMarkdown(REPEATED_MD))
    // "In practice," and "In practice the" both normalize to "in practice"
    const inPractice = findings.find(f => f.matchedText === 'in practice')
    expect(inPractice).toBeDefined()
    expect(inPractice!.count).toBeGreaterThanOrEqual(3)
  })

  it('flags a 2-word starter This is repeated 3+ times (normalized, lowercase)', () => {
    const findings = scanSentenceStarters(parseMarkdown(REPEATED_MD))
    const thisIs = findings.find(f => f.matchedText === 'this is')
    expect(thisIs).toBeDefined()
    expect(thisIs!.count).toBeGreaterThanOrEqual(3)
  })

  it('does not flag starters that appear fewer than 3 times', () => {
    const md = '## S\n\nIn practice this works. Another sentence here.'
    const findings = scanSentenceStarters(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('includes reason indicating 2-word or 3-word', () => {
    const findings = scanSentenceStarters(parseMarkdown(REPEATED_MD))
    expect(findings.every(f => f.reason === '2-word starter' || f.reason === '3-word starter')).toBe(true)
  })

  it('results are sorted by count descending', () => {
    const findings = scanSentenceStarters(parseMarkdown(REPEATED_MD))
    for (let i = 1; i < findings.length; i++) {
      expect(findings[i - 1].count!).toBeGreaterThanOrEqual(findings[i].count!)
    }
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/scanSentenceStarters.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement scanSentenceStarters.ts**

```ts
// features/language-check/lib/scanSentenceStarters.ts
import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'

const THRESHOLD = 3

// Normalize to catch "In practice," / "In practice the" / "In practice, many..."
// as the same "in practice" starter.
function normalizeSentenceStart(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, '')    // strip leading non-alphanumeric chars
    .replace(/[,;:!?.]+/g, ' ')    // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim()
}

export function scanSentenceStarters(article: ParsedArticle): Finding[] {
  const twoWordCount = new Map<string, number>()
  const threeWordCount = new Map<string, number>()

  for (const sentence of article.allSentences) {
    const words = normalizeSentenceStart(sentence).split(/\s+/).filter(Boolean)
    if (words.length >= 2) {
      const two = `${words[0]} ${words[1]}`
      twoWordCount.set(two, (twoWordCount.get(two) ?? 0) + 1)
    }
    if (words.length >= 3) {
      const three = `${words[0]} ${words[1]} ${words[2]}`
      threeWordCount.set(three, (threeWordCount.get(three) ?? 0) + 1)
    }
  }

  const findings: Finding[] = []

  for (const [starter, count] of twoWordCount) {
    if (count >= THRESHOLD) {
      findings.push({
        id: `starter-${findings.length}`,
        category: 'sentence-starter',
        severity: 'medium',
        matchedText: starter,
        reason: '2-word starter',
        count,
      })
    }
  }

  for (const [starter, count] of threeWordCount) {
    if (count >= THRESHOLD) {
      findings.push({
        id: `starter-${findings.length}`,
        category: 'sentence-starter',
        severity: 'medium',
        matchedText: starter,
        reason: '3-word starter',
        count,
      })
    }
  }

  return findings.sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/scanSentenceStarters.test.ts
```
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/lib/scanSentenceStarters.ts features/language-check/lib/__tests__/scanSentenceStarters.test.ts
git commit -m "feat: implement scanSentenceStarters 2-word and 3-word counter"
```

---

## Task 9: scanHeadingRestatement

**Files:**
- Create: `features/language-check/lib/scanHeadingRestatement.ts`
- Create: `features/language-check/lib/__tests__/scanHeadingRestatement.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/scanHeadingRestatement.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanHeadingRestatement } from '../scanHeadingRestatement'

describe('scanHeadingRestatement', () => {
  it('flags a heading whose first sentence strongly mirrors it', () => {
    const md = '## Health Insurance in Vietnam\n\nHealth insurance in Vietnam is important for all expats.'
    const findings = scanHeadingRestatement(parseMarkdown(md))
    expect(findings).toHaveLength(1)
    expect(findings[0].category).toBe('heading-restatement')
    expect(findings[0].matchedText).toBe('Health Insurance in Vietnam')
    expect(findings[0].surroundingText).toContain('Health insurance in Vietnam')
  })

  it('does not flag low-overlap headings', () => {
    const md = '## Health Insurance\n\nMany expats rely on private cover for routine checkups.'
    const findings = scanHeadingRestatement(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('skips sections with no first sentence', () => {
    const md = '## Empty Section\n\n'
    const findings = scanHeadingRestatement(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('includes the first sentence as surroundingText', () => {
    const md = '## Banking Options in Vietnam\n\nBanking options in Vietnam vary widely by bank type.'
    const findings = scanHeadingRestatement(parseMarkdown(md))
    expect(findings[0].surroundingText).toContain('Banking options in Vietnam')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/scanHeadingRestatement.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement scanHeadingRestatement.ts**

```ts
// features/language-check/lib/scanHeadingRestatement.ts
import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'at', 'on', 'of', 'for', 'to', 'is', 'are',
  'be', 'this', 'that', 'it', 'with', 'by', 'as', 'and', 'or', 'but',
  'from', 'not', 'all', 'your', 'you', 'can', 'how', 'do', 'does', 'will',
  'its', 'their', 'these', 'those', 'which', 'who', 'when', 'where',
])

const OVERLAP_THRESHOLD = 0.5

function meaningfulWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w))
  )
}

export function scanHeadingRestatement(article: ParsedArticle): Finding[] {
  const findings: Finding[] = []

  for (const section of article.sections) {
    if (!section.heading || section.sentences.length === 0) continue

    const headingWords = meaningfulWords(section.heading.text)
    if (headingWords.size === 0) continue

    const firstSentence = section.sentences[0]
    const sentenceWords = meaningfulWords(firstSentence)

    const overlap = [...headingWords].filter(w => sentenceWords.has(w)).length
    const ratio = overlap / headingWords.size

    if (ratio >= OVERLAP_THRESHOLD) {
      findings.push({
        id: `restate-${findings.length}`,
        category: 'heading-restatement',
        severity: 'medium',
        section: section.heading.text,
        matchedText: section.heading.text,
        surroundingText: firstSentence,
        reason: `${Math.round(ratio * 100)}% word overlap between heading and first sentence`,
      })
    }
  }

  return findings
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/scanHeadingRestatement.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/lib/scanHeadingRestatement.ts features/language-check/lib/__tests__/scanHeadingRestatement.test.ts
git commit -m "feat: implement scanHeadingRestatement word-overlap detector"
```

---

## Task 10: scanClosings

**Files:**
- Create: `features/language-check/lib/scanClosings.ts`
- Create: `features/language-check/lib/__tests__/scanClosings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/scanClosings.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanClosings } from '../scanClosings'

describe('scanClosings', () => {
  it('flags a tidy summary closing in the last paragraph', () => {
    const md = '## Choosing Cover\n\nSome information here.\n\nThe best option depends on your situation.'
    const findings = scanClosings(parseMarkdown(md))
    expect(findings).toHaveLength(1)
    expect(findings[0].category).toBe('tidy-closing')
    expect(findings[0].section).toBe('Choosing Cover')
    expect(findings[0].reason).toContain('tidy summary closing')
  })

  it('does not flag sections with no tidy closing', () => {
    const md = '## Section\n\nThis section ends with a concrete statement about documents.'
    const findings = scanClosings(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('produces at most one finding per section', () => {
    const md = '## S\n\nThe best option depends. The right choice depends on your needs.'
    const findings = scanClosings(parseMarkdown(md))
    expect(findings).toHaveLength(1)
  })

  it('reports the matched closing text', () => {
    const md = '## S\n\nSome text.\n\nThe key takeaway is that costs vary.'
    const findings = scanClosings(parseMarkdown(md))
    expect(findings[0].matchedText).toContain('key takeaway')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/scanClosings.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement scanClosings.ts**

```ts
// features/language-check/lib/scanClosings.ts
import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import closingRules from '../rules/closing-patterns.json'

type ClosingRule = {
  id: string
  pattern: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function scanClosings(article: ParsedArticle): Finding[] {
  const rules = (closingRules as ClosingRule[]).filter(r => r.enabled)
  const findings: Finding[] = []

  for (const section of article.sections) {
    if (!section.lastParagraph) continue
    const sectionLabel = section.heading?.text ?? 'Intro'

    for (const rule of rules) {
      const pattern = new RegExp(escapeRegex(rule.pattern), 'gi')
      if (pattern.test(section.lastParagraph)) {
        findings.push({
          id: `closing-${findings.length}`,
          category: 'tidy-closing',
          severity: rule.severity,
          section: sectionLabel,
          matchedText: section.lastParagraph.slice(0, 120),
          reason: rule.reason,
        })
        break
      }
    }
  }

  return findings
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/scanClosings.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/lib/scanClosings.ts features/language-check/lib/__tests__/scanClosings.test.ts
git commit -m "feat: implement scanClosings section-ending pattern detector"
```

---

## Task 11: scanAbstractWording

**Files:**
- Create: `features/language-check/lib/scanAbstractWording.ts`
- Create: `features/language-check/lib/__tests__/scanAbstractWording.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/scanAbstractWording.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanAbstractWording } from '../scanAbstractWording'

describe('scanAbstractWording', () => {
  it('counts an abstract word present in the article', () => {
    const md = '## S\n\nThe friction here is high. Friction slows progress. The friction compounds.'
    const findings = scanAbstractWording(parseMarkdown(md))
    const f = findings.find(f => f.matchedText === 'friction')
    expect(f).toBeDefined()
    expect(f!.count).toBe(3)
    expect(f!.category).toBe('abstract-wording')
  })

  it('does not include words with zero occurrences', () => {
    const md = '## S\n\nThis article mentions nothing abstract.'
    const findings = scanAbstractWording(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('sorts results by count descending', () => {
    const md = '## S\n\nFriction friction friction. Ecosystem ecosystem.'
    const findings = scanAbstractWording(parseMarkdown(md))
    for (let i = 1; i < findings.length; i++) {
      expect(findings[i - 1].count!).toBeGreaterThanOrEqual(findings[i].count!)
    }
  })

  it('includes a reason from the rule', () => {
    const md = '## S\n\nThe friction is high.'
    const findings = scanAbstractWording(parseMarkdown(md))
    expect(findings[0].reason).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/scanAbstractWording.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement scanAbstractWording.ts**

```ts
// features/language-check/lib/scanAbstractWording.ts
import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import abstractRules from '../rules/abstract-wording.json'

type AbstractRule = {
  id: string
  word: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function scanAbstractWording(article: ParsedArticle): Finding[] {
  const rules = (abstractRules as AbstractRule[]).filter(r => r.enabled)
  const findings: Finding[] = []

  for (const rule of rules) {
    const pattern = new RegExp(`\\b${escapeRegex(rule.word)}\\b`, 'gi')
    const matches = article.fullText.match(pattern)
    const count = matches?.length ?? 0
    if (count > 0) {
      findings.push({
        id: `abstract-${findings.length}`,
        category: 'abstract-wording',
        severity: rule.severity,
        matchedText: rule.word,
        reason: rule.reason,
        count,
      })
    }
  }

  return findings.sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/scanAbstractWording.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/language-check/lib/scanAbstractWording.ts features/language-check/lib/__tests__/scanAbstractWording.test.ts
git commit -m "feat: implement scanAbstractWording frequency counter"
```

---

## Task 12: runLanguageCheck + createMarkdownReport

**Files:**
- Create: `features/language-check/lib/createMarkdownReport.ts`
- Create: `features/language-check/lib/runLanguageCheck.ts`
- Create: `features/language-check/lib/__tests__/runLanguageCheck.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// features/language-check/lib/__tests__/runLanguageCheck.test.ts
import { describe, it, expect } from 'vitest'
import { runLanguageCheck } from '../runLanguageCheck'

const SAMPLE_MD = `
## Introduction

You can leverage the system seamlessly. Health insurance can feel overwhelming.

## Costs

Typically costs are low. Typically they vary. Typically it depends.
The best option depends on your situation.
`.trim()

describe('runLanguageCheck', () => {
  it('returns summary with totalFindings', () => {
    const result = runLanguageCheck({ markdown: SAMPLE_MD, articleType: 'procedure' })
    expect(result.summary.totalFindings).toBeGreaterThan(0)
    expect(result.summary.high + result.summary.medium + result.summary.low).toBe(result.summary.totalFindings)
  })

  it('returns findings array', () => {
    const result = runLanguageCheck({ markdown: SAMPLE_MD, articleType: 'procedure' })
    expect(Array.isArray(result.findings)).toBe(true)
    expect(result.findings.length).toBeGreaterThan(0)
  })

  it('returns markdownReport string', () => {
    const result = runLanguageCheck({ markdown: SAMPLE_MD, articleType: 'procedure' })
    expect(typeof result.markdownReport).toBe('string')
    expect(result.markdownReport).toContain('# Language Check Report')
    expect(result.markdownReport).toContain('## Summary')
    expect(result.markdownReport).toContain('## Vocabulary Flags')
    expect(result.markdownReport).toContain('## Overused Words')
    expect(result.markdownReport).toContain('## AI-Cadence Patterns')
    expect(result.markdownReport).toContain('## Phrase Family Patterns')
    expect(result.markdownReport).toContain('## Repeated Sentence Starters')
    expect(result.markdownReport).toContain('## Heading Restatements')
    expect(result.markdownReport).toContain('## Tidy Closings')
    expect(result.markdownReport).toContain('## Abstract / Formal Wording Count')
  })

  it('detects leverage as a vocabulary finding', () => {
    const result = runLanguageCheck({ markdown: SAMPLE_MD, articleType: 'procedure' })
    const vocabFindings = result.findings.filter(f => f.category === 'vocabulary')
    expect(vocabFindings.some(f => f.matchedText === 'leverage')).toBe(true)
  })

  it('detects typically as overuse finding', () => {
    const result = runLanguageCheck({ markdown: SAMPLE_MD, articleType: 'procedure' })
    const overuse = result.findings.filter(f => f.category === 'overuse')
    expect(overuse.some(f => f.matchedText === 'typically')).toBe(true)
  })

  it('report includes article type', () => {
    const result = runLanguageCheck({ markdown: SAMPLE_MD, articleType: 'living-insights' })
    expect(result.markdownReport).toContain('Living Insights')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- features/language-check/lib/__tests__/runLanguageCheck.test.ts
```
Expected: FAIL — `runLanguageCheck` not found.

- [ ] **Step 3: Implement createMarkdownReport.ts**

```ts
// features/language-check/lib/createMarkdownReport.ts
import type { ArticleType, CheckResult, Finding, FindingCategory } from './types'

function articleTypeLabel(t: ArticleType): string {
  const map: Record<ArticleType, string> = {
    procedure: 'Procedure',
    'living-insights': 'Living Insights',
    'living-cost': 'Living Cost',
  }
  return map[t]
}

function by(findings: Finding[], cat: FindingCategory): Finding[] {
  return findings.filter(f => f.category === cat)
}

function cell(v: string | number | undefined): string {
  return String(v ?? '').replace(/\|/g, '\\|')
}

function vocabTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f =>
    `| ${cell(f.section)} | ${cell(f.matchedText)} | ${f.severity} | ${cell(f.surroundingText)} | ${cell(f.replacementHint)} |`
  )
  return ['| Section | Flag | Severity | Text | Replacement hint |', '|---|---|---|---|---|', ...rows].join('\n') + '\n'
}

function overuseTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${f.count ?? 0} | ${f.limit ?? 0} |`)
  return ['| Word | Count | Limit |', '|---|---:|---:|', ...rows].join('\n') + '\n'
}

function aiTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f =>
    `| ${cell(f.section)} | ${cell(f.matchedText)} | ${f.severity} | ${cell(f.surroundingText)} |`
  )
  return ['| Section | Pattern | Severity | Text |', '|---|---|---|---|', ...rows].join('\n') + '\n'
}

function phraseFamilyTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${f.count ?? 0} | ${cell(f.surroundingText)} |`)
  return ['| Pattern family | Count | Examples |', '|---|---:|---|', ...rows].join('\n') + '\n'
}

function starterTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${cell(f.reason)} | ${f.count ?? 0} |`)
  return ['| Starter | Type | Count |', '|---|---|---:|', ...rows].join('\n') + '\n'
}

function restatementTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${cell(f.surroundingText)} |`)
  return ['| Heading | First sentence |', '|---|---|', ...rows].join('\n') + '\n'
}

function closingTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.section)} | ${cell(f.matchedText)} | ${cell(f.reason)} |`)
  return ['| Section | Matched text | Reason |', '|---|---|---|', ...rows].join('\n') + '\n'
}

function abstractTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${f.count ?? 0} | ${cell(f.reason)} |`)
  return ['| Word | Count | Reason |', '|---|---:|---|', ...rows].join('\n') + '\n'
}

export function createMarkdownReport({
  findings,
  summary,
  articleType,
}: Pick<CheckResult, 'findings' | 'summary'> & { articleType: ArticleType }): string {
  return [
    '# Language Check Report',
    '',
    `Article type: ${articleTypeLabel(articleType)}`,
    '',
    '## Summary',
    '',
    `Total findings: ${summary.totalFindings}  `,
    `High: ${summary.high}  `,
    `Medium: ${summary.medium}  `,
    `Low: ${summary.low}  `,
    '',
    '## Vocabulary Flags',
    '',
    vocabTable(by(findings, 'vocabulary')),
    '## Overused Words',
    '',
    overuseTable(by(findings, 'overuse')),
    '## AI-Cadence Patterns',
    '',
    aiTable(by(findings, 'ai-pattern')),
    '## Phrase Family Patterns',
    '',
    phraseFamilyTable(by(findings, 'phrase-family')),
    '## Repeated Sentence Starters',
    '',
    starterTable(by(findings, 'sentence-starter')),
    '## Heading Restatements',
    '',
    restatementTable(by(findings, 'heading-restatement')),
    '## Tidy Closings',
    '',
    closingTable(by(findings, 'tidy-closing')),
    '## Abstract / Formal Wording Count',
    '',
    abstractTable(by(findings, 'abstract-wording')),
  ].join('\n')
}
```

- [ ] **Step 4: Implement runLanguageCheck.ts**

```ts
// features/language-check/lib/runLanguageCheck.ts
import type { ArticleType, CheckResult, CheckSummary, Finding } from './types'
import { parseMarkdown } from './parseMarkdown'
import { scanVocabulary } from './scanVocabulary'
import { scanOveruse } from './scanOveruse'
import { scanAiPatterns } from './scanAiPatterns'
import { scanPhraseFamily } from './scanPhraseFamily'
import { scanSentenceStarters } from './scanSentenceStarters'
import { scanHeadingRestatement } from './scanHeadingRestatement'
import { scanClosings } from './scanClosings'
import { scanAbstractWording } from './scanAbstractWording'
import { createMarkdownReport } from './createMarkdownReport'

export function runLanguageCheck({
  markdown,
  articleType,
}: {
  markdown: string
  articleType: ArticleType
}): CheckResult {
  const article = parseMarkdown(markdown)

  const findings: Finding[] = [
    ...scanVocabulary(article, articleType),
    ...scanOveruse(article),
    ...scanAiPatterns(article),
    ...scanPhraseFamily(article),
    ...scanSentenceStarters(article),
    ...scanHeadingRestatement(article),
    ...scanClosings(article),
    ...scanAbstractWording(article),
  ]

  const summary: CheckSummary = {
    totalFindings: findings.length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
  }

  const markdownReport = createMarkdownReport({ findings, summary, articleType })

  return { summary, findings, markdownReport }
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npm run test -- features/language-check/lib/__tests__/runLanguageCheck.test.ts
```
Expected: all 6 tests PASS.

- [ ] **Step 6: Run full test suite to confirm no regressions**

```bash
npm run test
```
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add features/language-check/lib/runLanguageCheck.ts features/language-check/lib/createMarkdownReport.ts features/language-check/lib/__tests__/runLanguageCheck.test.ts
git commit -m "feat: implement runLanguageCheck orchestrator and Markdown report generator"
```

---

## Task 13: UI Components

**Files:**
- Create: `features/language-check/components/LanguageCheckForm.tsx`
- Create: `features/language-check/components/LanguageCheckResults.tsx`
- Create: `features/language-check/components/ReportPreview.tsx`

These are `'use client'` components. No tests (UI-only).

- [ ] **Step 1: Create LanguageCheckForm.tsx**

```tsx
// features/language-check/components/LanguageCheckForm.tsx
'use client'

import type { ArticleType } from '../lib/types'

type Props = {
  markdown: string
  articleType: ArticleType
  loading: boolean
  onMarkdownChange: (v: string) => void
  onArticleTypeChange: (v: ArticleType) => void
  onRun: () => void
  onClear: () => void
}

const ARTICLE_TYPE_OPTIONS: { value: ArticleType; label: string }[] = [
  { value: 'procedure', label: 'Procedure' },
  { value: 'living-insights', label: 'Living Insights' },
  { value: 'living-cost', label: 'Living Cost' },
]

export function LanguageCheckForm({
  markdown,
  articleType,
  loading,
  onMarkdownChange,
  onArticleTypeChange,
  onRun,
  onClear,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium shrink-0">Article type</label>
        <select
          value={articleType}
          onChange={e => onArticleTypeChange(e.target.value as ArticleType)}
          className="border border-input rounded px-3 py-1.5 text-sm bg-background"
        >
          {ARTICLE_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <textarea
        value={markdown}
        onChange={e => onMarkdownChange(e.target.value)}
        placeholder="Paste Markdown article here…"
        rows={14}
        className="w-full border border-input rounded px-3 py-2 text-sm bg-background font-mono resize-y"
      />

      <div className="flex gap-2">
        <button
          onClick={onRun}
          disabled={loading || !markdown.trim()}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Scanning…' : 'Run Check'}
        </button>
        <button
          onClick={onClear}
          disabled={!markdown.trim()}
          className="px-4 py-2 text-sm border border-border rounded hover:bg-muted disabled:opacity-40 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create LanguageCheckResults.tsx**

```tsx
// features/language-check/components/LanguageCheckResults.tsx
'use client'

import type { CheckResult, Finding, FindingCategory } from '../lib/types'

const SEVERITY_COLORS: Record<string, string> = {
  high: 'text-destructive',
  medium: 'text-yellow-600',
  low: 'text-muted-foreground',
}

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  vocabulary: 'Vocabulary Flags',
  overuse: 'Overused Words',
  'ai-pattern': 'AI-Cadence Patterns',
  'phrase-family': 'Phrase Family Patterns',
  'sentence-starter': 'Repeated Sentence Starters',
  'heading-restatement': 'Heading Restatements',
  'tidy-closing': 'Tidy Closings',
  'abstract-wording': 'Abstract / Formal Wording',
}

const CATEGORY_ORDER: FindingCategory[] = [
  'vocabulary', 'overuse', 'ai-pattern', 'phrase-family',
  'sentence-starter', 'heading-restatement', 'tidy-closing', 'abstract-wording',
]

function FindingRow({ f }: { f: Finding }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">{f.section ?? ''}</td>
      <td className={`py-1.5 pr-3 text-xs font-mono font-medium ${SEVERITY_COLORS[f.severity] ?? ''}`}>
        {f.matchedText}
        {f.count !== undefined && <span className="ml-1 text-muted-foreground">×{f.count}</span>}
        {f.limit !== undefined && <span className="ml-1 text-muted-foreground">(limit {f.limit})</span>}
      </td>
      <td className="py-1.5 pr-3 text-xs text-muted-foreground max-w-xs truncate" title={f.surroundingText}>
        {f.surroundingText ?? f.reason ?? ''}
      </td>
      <td className="py-1.5 text-xs text-muted-foreground">{f.replacementHint ?? ''}</td>
    </tr>
  )
}

function CategorySection({ category, findings }: { category: FindingCategory; findings: Finding[] }) {
  if (!findings.length) return null
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2">{CATEGORY_LABELS[category]}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <tbody>
            {findings.map(f => <FindingRow key={f.id} f={f} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type Props = {
  result: CheckResult
}

export function LanguageCheckResults({ result }: Props) {
  const { summary, findings } = result
  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-sm">
        <span>Total: <strong>{summary.totalFindings}</strong></span>
        <span className={SEVERITY_COLORS.high}>High: <strong>{summary.high}</strong></span>
        <span className={SEVERITY_COLORS.medium}>Medium: <strong>{summary.medium}</strong></span>
        <span className="text-muted-foreground">Low: <strong>{summary.low}</strong></span>
      </div>

      {CATEGORY_ORDER.map(cat => (
        <CategorySection
          key={cat}
          category={cat}
          findings={findings.filter(f => f.category === cat)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create ReportPreview.tsx**

```tsx
// features/language-check/components/ReportPreview.tsx
'use client'

import { useState } from 'react'

type Props = {
  report: string
}

export function ReportPreview({ report }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Markdown Report</h2>
        <button
          onClick={handleCopy}
          className="text-sm px-3 py-1.5 border border-border rounded hover:bg-muted transition-colors"
        >
          {copied ? 'Copied!' : 'Copy report'}
        </button>
      </div>
      <pre className="text-xs bg-muted/40 border border-border rounded p-4 overflow-x-auto whitespace-pre-wrap font-mono max-h-96">
        {report}
      </pre>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add features/language-check/components/
git commit -m "feat: add LanguageCheckForm, LanguageCheckResults, ReportPreview components"
```

---

## Task 14: Wire page.tsx and verify build

**Files:**
- Modify: `app/(app)/language-check/page.tsx`

- [ ] **Step 1: Replace the shell page with the wired-up page**

```tsx
// app/(app)/language-check/page.tsx
'use client'

import { useState } from 'react'
import type { ArticleType, CheckResult } from '@/features/language-check/lib/types'
import { runLanguageCheck } from '@/features/language-check/lib/runLanguageCheck'
import { LanguageCheckForm } from '@/features/language-check/components/LanguageCheckForm'
import { LanguageCheckResults } from '@/features/language-check/components/LanguageCheckResults'
import { ReportPreview } from '@/features/language-check/components/ReportPreview'

export default function LanguageCheckPage() {
  const [markdown, setMarkdown] = useState('')
  const [articleType, setArticleType] = useState<ArticleType>('procedure')
  const [result, setResult] = useState<CheckResult | null>(null)

  function handleRun() {
    if (!markdown.trim()) return
    const r = runLanguageCheck({ markdown, articleType })
    setResult(r)
  }

  function handleClear() {
    setMarkdown('')
    setResult(null)
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Language Check</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scan an article for vocabulary flags, AI-style phrasing, repeated patterns, and weak section endings.
        </p>
      </div>

      <LanguageCheckForm
        markdown={markdown}
        articleType={articleType}
        loading={false}
        onMarkdownChange={setMarkdown}
        onArticleTypeChange={setArticleType}
        onRun={handleRun}
        onClear={handleClear}
      />

      {result && (
        <>
          <LanguageCheckResults result={result} />
          <ReportPreview report={result.markdownReport} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
cd /Users/shaft/Desktop/serp && npm run test
```
Expected: all tests PASS.

- [ ] **Step 3: Run build**

```bash
npm run build
```
Expected: exits 0, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/language-check/page.tsx
git commit -m "feat: wire up language-check page with form, results, and report"
```

---

## Self-Review

### Spec coverage check

| Spec section | Covered by task |
|---|---|
| Language Check sidebar item | Task 1 |
| Route `/language-check` | Task 1 |
| Article type selector (procedure, living-insights, living-cost) | Task 13 |
| Textarea for pasting Markdown | Task 13 |
| Run Check button | Task 13 |
| Clear button | Task 13 |
| Vocabulary Flags group | Task 4, 13 |
| Overused Words group | Task 5, 13 |
| AI-Cadence Patterns group | Task 6, 13 |
| Phrase Family Patterns group | Task 7, 13 |
| Repeated Sentence Starters (2-word, 3-word) | Task 8, 13 |
| Heading Restatements group | Task 9, 13 |
| Tidy Closings group | Task 10, 13 |
| Abstract / Formal Wording Count group | Task 11, 13 |
| Markdown report with all sections | Task 12 |
| Copy report button | Task 13 |
| JSON rule files as source of truth | Task 2 |
| Whitelist for visa/program names | Task 2 |
| Client-side scan (no API route) | Task 14 |
| Living-insights vocabulary scoped to type | Task 4 |
| Types in `lib/types.ts` (not feature root) | Task 1 |
| remark AST parser (not custom regex) | Task 3 |
| Sentence starter normalization (lowercase, strip punctuation) | Task 8 |

All spec requirements are covered.

### Placeholder scan

No TBDs, TODOs, or "fill in" placeholders. All steps include complete code.

### Type consistency

- `Finding` type defined in Task 1, used in Tasks 4–13. All fields (`id`, `category`, `severity`, `section`, `matchedText`, `surroundingText`, `reason`, `replacementHint`, `count`, `limit`) match the definition.
- `ParsedArticle` defined in Task 3, imported in Tasks 4–11.
- `ArticleType` defined in Task 1, used in Tasks 4, 12, 13, 14.
- `CheckResult` defined in Task 1, returned by Task 12, consumed in Task 14.
- All scanner functions return `Finding[]` — consistent throughout.
- `createMarkdownReport` accepts `Pick<CheckResult, 'findings' | 'summary'> & { articleType }` — consistent with what `runLanguageCheck` provides in Task 12.
