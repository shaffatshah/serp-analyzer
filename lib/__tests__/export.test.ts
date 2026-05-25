import { describe, it, expect } from 'vitest'
import { exportToJson, exportToCsv, exportToMarkdown } from '../export'
import type { PageResult } from '../types'

const RESULT: PageResult = {
  id: 'test-id',
  url: 'https://example.com/page',
  domain: 'example.com',
  httpStatus: 200,
  fetchedAt: '2026-05-25T10:00:00.000Z',
  status: 'ok',
  title: 'Test Page',
  metaDescription: 'A test page',
  canonicalUrl: 'https://example.com/page',
  robotsMeta: 'index, follow',
  headingOutline: [
    { level: 1, text: 'Main Title' },
    { level: 2, text: 'Section One' },
  ],
  excerpt: 'First two hundred words of content here.',
  wordCount: 500,
  schemaTypes: ['Article'],
  internalLinkCount: 10,
  externalLinkCount: 5,
  keyword: 'test keyword',
  serpPosition: '3',
  notes: 'Good structure',
}

describe('exportToJson', () => {
  it('produces valid JSON array with all fields', () => {
    const parsed = JSON.parse(exportToJson([RESULT]))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].url).toBe('https://example.com/page')
    expect(parsed[0].headingOutline).toHaveLength(2)
  })
})

describe('exportToCsv', () => {
  it('produces header row and one data row', () => {
    const lines = exportToCsv([RESULT]).split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('url')
    expect(lines[1]).toContain('example.com')
  })

  it('flattens headingOutline to pipe-separated string', () => {
    expect(exportToCsv([RESULT])).toContain('H1: Main Title | H2: Section One')
  })

  it('escapes double quotes in cell values', () => {
    const result = { ...RESULT, title: 'He said "hello"' }
    expect(exportToCsv([result])).toContain('He said ""hello""')
  })
})

describe('exportToMarkdown', () => {
  it('uses title as section heading', () => {
    expect(exportToMarkdown([RESULT])).toContain('## Test Page')
  })

  it('includes URL', () => {
    expect(exportToMarkdown([RESULT])).toContain('https://example.com/page')
  })

  it('renders headings with H-prefix', () => {
    const md = exportToMarkdown([RESULT])
    expect(md).toContain('H1: Main Title')
    expect(md).toContain('H2: Section One')
  })

  it('separates multiple results with hr', () => {
    expect(exportToMarkdown([RESULT, RESULT])).toContain('\n---\n')
  })
})
