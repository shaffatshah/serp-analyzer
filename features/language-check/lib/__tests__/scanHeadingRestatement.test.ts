import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'
import { scanHeadingRestatement } from '../scanHeadingRestatement'

describe('scanHeadingRestatement', () => {
  it('flags a heading whose first sentence strongly mirrors it', () => {
    const md = '## Health Insurance in Vietnam\n\nHealth insurance in Vietnam is important for all expats.'
    const findings = scanHeadingRestatement(parseMarkdown(md))
    expect(findings).toHaveLength(1)
    expect(findings[0].category).toBe('heading-restatement')
    expect(findings[0].matchedText).toBe('Health Insurance in Vietnam')
    expect(findings[0].surroundingText).toContain('Health insurance in Vietnam')
  })

  it('does not flag low-overlap headings', () => {
    const md = '## Health Insurance\n\nMany expats rely on private cover for routine checkups.'
    const findings = scanHeadingRestatement(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('skips sections with no first sentence', () => {
    const md = '## Empty Section\n\n'
    const findings = scanHeadingRestatement(parseMarkdown(md))
    expect(findings).toHaveLength(0)
  })

  it('includes the first sentence as surroundingText', () => {
    const md = '## Banking Options in Vietnam\n\nBanking options in Vietnam vary widely by bank type.'
    const findings = scanHeadingRestatement(parseMarkdown(md))
    expect(findings[0].surroundingText).toContain('Banking options in Vietnam')
  })
})
