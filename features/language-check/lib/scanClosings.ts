import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import closingRules from '../rules/closing-patterns.json'

type ClosingRule = {
  id: string
  pattern: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function scanClosings(article: ParsedArticle): Finding[] {
  const rules = (closingRules as ClosingRule[]).filter(r => r.enabled)
  const findings: Finding[] = []

  for (const section of article.sections) {
    if (!section.lastParagraph) continue
    const sectionLabel = section.heading?.text ?? 'Intro'

    for (const rule of rules) {
      const pattern = new RegExp(escapeRegex(rule.pattern), 'gi')
      if (pattern.test(section.lastParagraph)) {
        findings.push({
          id: `closing-${findings.length}`,
          category: 'tidy-closing',
          severity: rule.severity,
          section: sectionLabel,
          matchedText: section.lastParagraph.slice(0, 120),
          reason: rule.reason,
        })
        break
      }
    }
  }

  return findings
}
