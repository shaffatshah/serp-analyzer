import type { ArticleType, CheckResult, CheckSummary, Finding } from './types'
import { parseMarkdown } from './parseMarkdown'
import { scanVocabulary } from './scanVocabulary'
import { scanOveruse } from './scanOveruse'
import { scanAiPatterns } from './scanAiPatterns'
import { scanPhraseFamily } from './scanPhraseFamily'
import { scanSentenceStarters } from './scanSentenceStarters'
import { scanHeadingRestatement } from './scanHeadingRestatement'
import { scanClosings } from './scanClosings'
import { scanAbstractWording } from './scanAbstractWording'
import { createMarkdownReport } from './createMarkdownReport'

export function runLanguageCheck({
  markdown,
  articleType,
}: {
  markdown: string
  articleType: ArticleType
}): CheckResult {
  const article = parseMarkdown(markdown)

  const findings: Finding[] = [
    ...scanVocabulary(article, articleType),
    ...scanOveruse(article),
    ...scanAiPatterns(article),
    ...scanPhraseFamily(article),
    ...scanSentenceStarters(article),
    ...scanHeadingRestatement(article),
    ...scanClosings(article),
    ...scanAbstractWording(article),
  ]

  const summary: CheckSummary = {
    totalFindings: findings.length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
  }

  const markdownReport = createMarkdownReport({ findings, summary, articleType })

  return { summary, findings, markdownReport }
}
