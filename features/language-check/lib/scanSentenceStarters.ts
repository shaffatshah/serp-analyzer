import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'

const THRESHOLD = 3

function normalizeSentenceStart(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[,;:!?.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function scanSentenceStarters(article: ParsedArticle): Finding[] {
  const twoWordCount = new Map<string, number>()
  const threeWordCount = new Map<string, number>()

  for (const sentence of article.allSentences) {
    const words = normalizeSentenceStart(sentence).split(/\s+/).filter(Boolean)
    if (words.length >= 2) {
      const two = `${words[0]} ${words[1]}`
      twoWordCount.set(two, (twoWordCount.get(two) ?? 0) + 1)
    }
    if (words.length >= 3) {
      const three = `${words[0]} ${words[1]} ${words[2]}`
      threeWordCount.set(three, (threeWordCount.get(three) ?? 0) + 1)
    }
  }

  const findings: Finding[] = []

  for (const [starter, count] of twoWordCount) {
    if (count >= THRESHOLD) {
      findings.push({
        id: `starter-${findings.length}`,
        category: 'sentence-starter',
        severity: 'medium',
        matchedText: starter,
        reason: '2-word starter',
        count,
      })
    }
  }

  for (const [starter, count] of threeWordCount) {
    if (count >= THRESHOLD) {
      findings.push({
        id: `starter-${findings.length}`,
        category: 'sentence-starter',
        severity: 'medium',
        matchedText: starter,
        reason: '3-word starter',
        count,
      })
    }
  }

  return findings.sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
}
