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
