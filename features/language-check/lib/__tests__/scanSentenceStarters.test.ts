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
