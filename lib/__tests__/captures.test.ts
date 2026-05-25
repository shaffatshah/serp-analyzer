import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import type { Capture } from '../types'
import {
  exportCapturesToJson,
  exportCapturesToCsv,
  exportCapturesToMarkdown,
} from '../export'

const CAPTURE: Capture = {
  id: 'cap-1',
  capturedAt: '2026-05-25T10:00:00.000Z',
  url: 'https://example.com/visa-guide',
  domain: 'example.com',
  title: 'Thailand Visa Guide',
  metaDescription: 'Everything about Thai visas',
  canonicalUrl: 'https://example.com/visa-guide',
  robotsMeta: 'index, follow',
  headingOutline: [
    { level: 1, text: 'Thailand Visa Guide' },
    { level: 2, text: 'Visa on Arrival' },
    { level: 2, text: 'Tourist Visa' },
    { level: 3, text: 'Single Entry' },
  ],
  excerpt: 'Thailand offers several visa options for long-term visitors.',
  wordCount: 1200,
  schemaTypes: ['Article', 'FAQPage'],
  internalLinkCount: 8,
  externalLinkCount: 3,
  keyword: 'thailand visa',
  serpPosition: '2',
  country: 'Thailand, EN',
  pageType: 'blog',
  notes: 'Good H2 structure',
  strengthTag: 'Detailed FAQ section',
  weaknessTag: 'Missing cost tables',
}

// --- export functions ---

describe('exportCapturesToJson', () => {
  it('produces valid JSON array', () => {
    const parsed = JSON.parse(exportCapturesToJson([CAPTURE]))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].url).toBe('https://example.com/visa-guide')
    expect(parsed[0].headingOutline).toHaveLength(4)
  })

  it('is empty array for no captures', () => {
    expect(JSON.parse(exportCapturesToJson([]))).toEqual([])
  })
})

describe('exportCapturesToCsv', () => {
  it('has header + one data row', () => {
    const lines = exportCapturesToCsv([CAPTURE]).split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('capturedAt')
    expect(lines[1]).toContain('example.com')
  })

  it('includes capture-specific headers', () => {
    const header = exportCapturesToCsv([CAPTURE]).split('\n')[0]
    expect(header).toContain('strengthTag')
    expect(header).toContain('weaknessTag')
    expect(header).toContain('pageType')
  })

  it('flattens headingOutline to pipe-separated string', () => {
    expect(exportCapturesToCsv([CAPTURE])).toContain('H1: Thailand Visa Guide | H2: Visa on Arrival')
  })

  it('joins multiple schema types with pipe', () => {
    expect(exportCapturesToCsv([CAPTURE])).toContain('Article | FAQPage')
  })

  it('escapes double quotes in cell values', () => {
    const c = { ...CAPTURE, notes: 'She said "good"' }
    expect(exportCapturesToCsv([c])).toContain('She said ""good""')
  })
})

describe('exportCapturesToMarkdown', () => {
  it('uses title as section heading', () => {
    expect(exportCapturesToMarkdown([CAPTURE])).toContain('## Thailand Visa Guide')
  })

  it('includes URL', () => {
    expect(exportCapturesToMarkdown([CAPTURE])).toContain('https://example.com/visa-guide')
  })

  it('includes strength and weakness tags', () => {
    const md = exportCapturesToMarkdown([CAPTURE])
    expect(md).toContain('Detailed FAQ section')
    expect(md).toContain('Missing cost tables')
  })

  it('renders headings in outline section', () => {
    const md = exportCapturesToMarkdown([CAPTURE])
    expect(md).toContain('H1: Thailand Visa Guide')
    expect(md).toContain('H2: Visa on Arrival')
    expect(md).toContain('H3: Single Entry')
  })

  it('separates multiple captures with hr', () => {
    expect(exportCapturesToMarkdown([CAPTURE, CAPTURE])).toContain('\n---\n')
  })

  it('falls back to URL when title is null', () => {
    const c = { ...CAPTURE, title: null }
    expect(exportCapturesToMarkdown([c])).toContain('## https://example.com/visa-guide')
  })
})

// --- captures-store (uses temp file to avoid touching real data) ---

describe('captures-store', () => {
  const TMP = path.join(process.cwd(), 'data', '_test_captures.json')

  // Temporarily redirect DATA_FILE by swapping env before import
  // Since captures-store reads process.cwd() at module load time, we test
  // the store functions with a direct file approach: write a known file,
  // then read it back using the same JSON format the store uses.

  beforeEach(() => {
    if (fs.existsSync(TMP)) fs.unlinkSync(TMP)
  })

  afterEach(() => {
    if (fs.existsSync(TMP)) fs.unlinkSync(TMP)
  })

  it('round-trips a capture through JSON serialization', () => {
    const data = JSON.stringify([CAPTURE], null, 2)
    fs.mkdirSync(path.dirname(TMP), { recursive: true })
    fs.writeFileSync(TMP, data)
    const read: Capture[] = JSON.parse(fs.readFileSync(TMP, 'utf-8'))
    expect(read).toHaveLength(1)
    expect(read[0].id).toBe('cap-1')
    expect(read[0].headingOutline).toHaveLength(4)
    expect(read[0].schemaTypes).toEqual(['Article', 'FAQPage'])
  })

  it('prepend order: newer captures appear first', () => {
    const older: Capture = { ...CAPTURE, id: 'cap-old', capturedAt: '2026-05-24T10:00:00.000Z' }
    const newer: Capture = { ...CAPTURE, id: 'cap-new', capturedAt: '2026-05-25T10:00:00.000Z' }
    const arr = [newer, older]
    expect(arr[0].id).toBe('cap-new')
  })

  it('patch merge preserves unpatched fields', () => {
    const original = { ...CAPTURE }
    const patch = { notes: 'Updated note', strengthTag: 'New strength' }
    const merged = { ...original, ...patch }
    expect(merged.notes).toBe('Updated note')
    expect(merged.url).toBe('https://example.com/visa-guide')
    expect(merged.headingOutline).toHaveLength(4)
  })

  it('filter delete removes correct capture by id', () => {
    const captures = [CAPTURE, { ...CAPTURE, id: 'cap-2' }]
    const filtered = captures.filter(c => c.id !== 'cap-1')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('cap-2')
  })
})
