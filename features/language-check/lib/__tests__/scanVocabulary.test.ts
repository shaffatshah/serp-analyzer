import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanVocabulary } from '../scanVocabulary'

describe('scanVocabulary', () => {
  it('flags a word from the always-list', () => {
    const article = parseMarkdown('## Section\n\nYou can leverage the system to get results.')
    const findings = scanVocabulary(article, 'procedure')
    expect(findings).toHaveLength(1)
    expect(findings[0].matchedText).toBe('leverage')
    expect(findings[0].category).toBe('vocabulary')
    expect(findings[0].severity).toBe('high')
    expect(findings[0].section).toBe('Section')
  })

  it('does not flag whitelisted terms', () => {
    const article = parseMarkdown('## Section\n\nThe TRC is the Temporary Residence Card.')
    const findings = scanVocabulary(article, 'procedure')
    expect(findings).toHaveLength(0)
  })

  it('applies living-insights vocab only for living-insights type', () => {
    const md = '## Section\n\nThe framework for healthcare here is complex.'
    const procedure = scanVocabulary(parseMarkdown(md), 'procedure')
    const li = scanVocabulary(parseMarkdown(md), 'living-insights')
    expect(procedure).toHaveLength(0)
    expect(li).toHaveLength(1)
    expect(li[0].matchedText).toBe('framework')
  })

  it('does not flag living-insights vocab for living-cost type', () => {
    const article = parseMarkdown('## Section\n\nThe framework for costs.')
    const findings = scanVocabulary(article, 'living-cost')
    expect(findings).toHaveLength(0)
  })

  it('flags a phrase match', () => {
    const article = parseMarkdown('## Section\n\nA wide range of options exist.')
    const findings = scanVocabulary(article, 'procedure')
    expect(findings.some(f => f.matchedText === 'a wide range of')).toBe(true)
  })

  it('includes a replacement hint', () => {
    const article = parseMarkdown('## Section\n\nThis is daunting for most people.')
    const findings = scanVocabulary(article, 'procedure')
    expect(findings[0].replacementHint).toBeTruthy()
  })
})
