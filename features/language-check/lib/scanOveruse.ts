import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import overuseRules from '../rules/overuse-words.json'
import whitelist from '../rules/whitelist.json'

type OveruseRule = {
  id: string
  word: string
  limit: number
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

export function scanOveruse(article: ParsedArticle): Finding[] {
  const rules = (overuseRules as OveruseRule[]).filter(r => r.enabled)
  const safeText = applyWhitelist(article.fullText)
  const findings: Finding[] = []

  for (const rule of rules) {
    const pattern = new RegExp(`\\b${escapeRegex(rule.word)}\\b`, 'gi')
    const matches = safeText.match(pattern)
    const count = matches?.length ?? 0
    if (count > rule.limit) {
      findings.push({
        id: `overuse-${findings.length}`,
        category: 'overuse',
        severity: rule.severity,
        matchedText: rule.word,
        replacementHint: rule.replacementHint,
        count,
        limit: rule.limit,
      })
    }
  }

  return findings
}
