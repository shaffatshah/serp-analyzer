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
