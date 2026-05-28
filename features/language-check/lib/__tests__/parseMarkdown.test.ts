import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parseMarkdown'

const MD = `
## Banking in Vietnam

Opening a bank account here is simpler than most people expect. You need a passport and a visa. Most banks accept short-stay visas.

### Which banks accept foreigners

Vietcombank and Techcombank both accept foreigners with a standard tourist visa.

## ATM Fees

ATM fees vary by bank. Some banks charge flat fees.
`.trim()

describe('parseMarkdown', () => {
  it('extracts sections with headings', () => {
    const result = parseMarkdown(MD)
    expect(result.sections).toHaveLength(3)
    expect(result.sections[0].heading).toEqual({ level: 2, text: 'Banking in Vietnam' })
    expect(result.sections[1].heading).toEqual({ level: 3, text: 'Which banks accept foreigners' })
    expect(result.sections[2].heading).toEqual({ level: 2, text: 'ATM Fees' })
  })

  it('strips markdown syntax from rawText', () => {
    const result = parseMarkdown('## Section\n\nThis is **bold** and [a link](https://example.com).')
    expect(result.sections[0].rawText).toContain('bold')
    expect(result.sections[0].rawText).not.toContain('**')
    expect(result.sections[0].rawText).not.toContain('(https://')
  })

  it('produces allSentences from all sections', () => {
    const result = parseMarkdown(MD)
    expect(result.allSentences.length).toBeGreaterThan(3)
    expect(result.allSentences[0]).toContain('simpler than most people expect')
  })

  it('sets lastParagraph to the last paragraph in each section', () => {
    const result = parseMarkdown(MD)
    expect(result.sections[0].lastParagraph).toContain('short-stay visas')
  })

  it('handles article with no headings', () => {
    const result = parseMarkdown('Just a paragraph. Another sentence.')
    expect(result.sections).toHaveLength(1)
    expect(result.sections[0].heading).toBeNull()
  })
})
