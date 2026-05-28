import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'at', 'on', 'of', 'for', 'to', 'is', 'are',
  'be', 'this', 'that', 'it', 'with', 'by', 'as', 'and', 'or', 'but',
  'from', 'not', 'all', 'your', 'you', 'can', 'how', 'do', 'does', 'will',
  'its', 'their', 'these', 'those', 'which', 'who', 'when', 'where',
])

const OVERLAP_THRESHOLD = 0.5

function meaningfulWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w))
  )
}

export function scanHeadingRestatement(article: ParsedArticle): Finding[] {
  const findings: Finding[] = []

  for (const section of article.sections) {
    if (!section.heading || section.sentences.length === 0) continue

    const headingWords = meaningfulWords(section.heading.text)
    if (headingWords.size === 0) continue

    const firstSentence = section.sentences[0]
    const sentenceWords = meaningfulWords(firstSentence)

    const overlap = [...headingWords].filter(w => sentenceWords.has(w)).length
    const ratio = overlap / headingWords.size

    if (ratio >= OVERLAP_THRESHOLD) {
      findings.push({
        id: `restate-${findings.length}`,
        category: 'heading-restatement',
        severity: 'medium',
        section: section.heading.text,
        matchedText: section.heading.text,
        surroundingText: firstSentence,
        reason: `${Math.round(ratio * 100)}% word overlap between heading and first sentence`,
      })
    }
  }

  return findings
}
