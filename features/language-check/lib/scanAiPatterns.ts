import type { Finding } from './types'
import type { ParsedArticle } from './parseMarkdown'
import aiPatternRules from '../rules/ai-patterns.json'

type AiPatternRule = {
  id: string
  pattern: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  enabled: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function scanAiPatterns(article: ParsedArticle): Finding[] {
  const rules = (aiPatternRules as AiPatternRule[]).filter(r => r.enabled)
  const findings: Finding[] = []

  for (const section of article.sections) {
    const sectionLabel = section.heading?.text ?? 'Intro'
    for (const rule of rules) {
      const pattern = new RegExp(escapeRegex(rule.pattern), 'gi')
      let match: RegExpExecArray | null
      while ((match = pattern.exec(section.rawText)) !== null) {
        const start = Math.max(0, match.index - 60)
        const end = Math.min(section.rawText.length, match.index + match[0].length + 60)
        findings.push({
          id: `ai-${findings.length}`,
          category: 'ai-pattern',
          severity: rule.severity,
          section: sectionLabel,
          matchedText: rule.pattern,
          surroundingText: section.rawText.slice(start, end),
          reason: rule.reason,
        })
      }
    }
  }

  return findings
}
