import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import phraseFamilyRules from '../rules/phrase-families.json'

type PhraseFamilyRule = {
  id: string
  label: string
  pattern: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  enabled: boolean
}

export function scanPhraseFamily(article: ParsedArticle): Finding[] {
  const rules = (phraseFamilyRules as PhraseFamilyRule[]).filter(r => r.enabled)
  const findings: Finding[] = []

  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern, 'gi')
    const matches: string[] = []
    let match: RegExpExecArray | null
    while ((match = pattern.exec(article.fullText)) !== null) {
      matches.push(match[0])
    }

    if (matches.length > 0) {
      const uniqueExamples = [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 5)
      findings.push({
        id: `phrase-${findings.length}`,
        category: 'phrase-family',
        severity: rule.severity,
        matchedText: rule.label,
        surroundingText: uniqueExamples.join('; '),
        reason: rule.reason,
        count: matches.length,
      })
    }
  }

  return findings
}
