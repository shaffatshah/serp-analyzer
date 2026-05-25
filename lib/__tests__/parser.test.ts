import { describe, it, expect } from 'vitest'
import { parseHtml, isJsRenderedIncomplete } from '../parser'

const BODY_WORDS = Array(150).fill('word').join(' ')

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <meta name="description" content="A test page">
  <link rel="canonical" href="https://example.com/test">
  <meta name="robots" content="index, follow">
  <script type="application/ld+json">{"@type":"Article"}</script>
</head>
<body>
  <h1>Main Title</h1>
  <h2>Section One</h2>
  <h3>Subsection</h3>
  <h2>Section Two</h2>
  <p>${BODY_WORDS}</p>
  <a href="/internal">Internal</a>
  <a href="https://other.com">External</a>
</body>
</html>`

describe('parseHtml', () => {
  it('extracts title', () => {
    expect(parseHtml(SAMPLE_HTML, 'https://example.com/test').title).toBe('Test Page')
  })

  it('extracts meta description', () => {
    expect(parseHtml(SAMPLE_HTML, 'https://example.com/test').metaDescription).toBe('A test page')
  })

  it('extracts canonical URL', () => {
    expect(parseHtml(SAMPLE_HTML, 'https://example.com/test').canonicalUrl).toBe('https://example.com/test')
  })

  it('extracts robots meta', () => {
    expect(parseHtml(SAMPLE_HTML, 'https://example.com/test').robotsMeta).toBe('index, follow')
  })

  it('extracts heading outline in page order', () => {
    expect(parseHtml(SAMPLE_HTML, 'https://example.com/test').headingOutline).toEqual([
      { level: 1, text: 'Main Title' },
      { level: 2, text: 'Section One' },
      { level: 3, text: 'Subsection' },
      { level: 2, text: 'Section Two' },
    ])
  })

  it('extracts schema types', () => {
    expect(parseHtml(SAMPLE_HTML, 'https://example.com/test').schemaTypes).toContain('Article')
  })

  it('counts internal and external links', () => {
    const result = parseHtml(SAMPLE_HTML, 'https://example.com/test')
    expect(result.internalLinkCount).toBe(1)
    expect(result.externalLinkCount).toBe(1)
  })

  it('limits excerpt to 200 words', () => {
    const result = parseHtml(SAMPLE_HTML, 'https://example.com/test')
    const wordCount = result.excerpt?.split(' ').length ?? 0
    expect(wordCount).toBeLessThanOrEqual(200)
  })

  it('returns null excerpt for empty body', () => {
    const emptyHtml = '<html><head><title>Empty</title></head><body></body></html>'
    expect(parseHtml(emptyHtml, 'https://example.com').excerpt).toBeNull()
  })

  it('ignores script and style content in word count', () => {
    const html = `<html><body><script>var x = "lots of js code here"</script><p>just five real words here</p></body></html>`
    const result = parseHtml(html, 'https://example.com')
    expect(result.wordCount).toBeLessThan(20)
  })
})

describe('isJsRenderedIncomplete', () => {
  it('returns true when wordCount is null', () => {
    expect(isJsRenderedIncomplete(null)).toBe(true)
  })

  it('returns true when wordCount is under 100', () => {
    expect(isJsRenderedIncomplete(50)).toBe(true)
  })

  it('returns false when wordCount is 100 or more', () => {
    expect(isJsRenderedIncomplete(100)).toBe(false)
    expect(isJsRenderedIncomplete(500)).toBe(false)
  })
})
