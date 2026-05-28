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
