import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import abstractRules from '../rules/abstract-wording.json'

type AbstractRule = {
  id: string
  word: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function scanAbstractWording(article: ParsedArticle): Finding[] {
  const rules = (abstractRules as AbstractRule[]).filter(r => r.enabled)
  const findings: Finding[] = []

  for (const rule of rules) {
    const pattern = new RegExp(`\\b${escapeRegex(rule.word)}\\b`, 'gi')
    const matches = article.fullText.match(pattern)
    const count = matches?.length ?? 0
    if (count > 0) {
      findings.push({
        id: `abstract-${findings.length}`,
        category: 'abstract-wording',
        severity: rule.severity,
        matchedText: rule.word,
        reason: rule.reason,
        count,
      })
    }
  }

  return findings.sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
}
