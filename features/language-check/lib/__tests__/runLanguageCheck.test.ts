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
