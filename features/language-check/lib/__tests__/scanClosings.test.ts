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
