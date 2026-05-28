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
