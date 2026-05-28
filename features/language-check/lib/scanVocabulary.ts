import type { ArticleType, Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import alwaysRules from '../rules/vocabulary-always.json'
import liRules from '../rules/vocabulary-living-insights.json'
import whitelist from '../rules/whitelist.json'

type VocabRule = {
  id: string
  phrase: string
  matchType: 'word' | 'phrase'
  severity: 'high' | 'medium' | 'low'
  replacementHint: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyWhitelist(text: string): string {
  let result = text
  for (const term of whitelist as string[]) {
    result = result.replace(
      new RegExp(escapeRegex(term), 'gi'),
      ' '.repeat(term.length)
    )
  }
  return result
}

function makePattern(phrase: string, matchType: 'word' | 'phrase'): RegExp {
  const esc = escapeRegex(phrase)
  return matchType === 'word'
    ? new RegExp(`\\b${esc}\\b`, 'gi')
    : new RegExp(esc, 'gi')
}

export function scanVocabulary(
  article: ParsedArticle,
  articleType: ArticleType,
): Finding[] {
  const rules: VocabRule[] = [
    ...(alwaysRules as VocabRule[]).filter(r => r.enabled),
    ...(articleType === 'living-insights'
      ? (liRules as VocabRule[]).filter(r => r.enabled)
      : []),
  ]

  const findings: Finding[] = []

  for (const section of article.sections) {
    const sectionLabel = section.heading?.text ?? 'Intro'
    const safeText = applyWhitelist(section.rawText)

    for (const rule of rules) {
      const pattern = makePattern(rule.phrase, rule.matchType)
      let match: RegExpExecArray | null
      while ((match = pattern.exec(safeText)) !== null) {
        const start = Math.max(0, match.index - 60)
        const end = Math.min(safeText.length, match.index + match[0].length + 60)
        findings.push({
          id: `vocab-${findings.length}`,
          category: 'vocabulary',
          severity: rule.severity,
          section: sectionLabel,
          matchedText: rule.phrase,
          surroundingText: section.rawText.slice(start, end),
          replacementHint: rule.replacementHint,
        })
      }
    }
  }

  return findings
}
