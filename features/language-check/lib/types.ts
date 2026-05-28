export type ArticleType = 'procedure' | 'living-insights' | 'living-cost'

export type FindingCategory =
  | 'vocabulary'
  | 'overuse'
  | 'ai-pattern'
  | 'sentence-starter'
  | 'heading-restatement'
  | 'tidy-closing'
  | 'phrase-family'
  | 'abstract-wording'

export type Severity = 'high' | 'medium' | 'low'

export type Finding = {
  id: string
  category: FindingCategory
  severity: Severity
  section?: string
  matchedText: string
  surroundingText?: string
  reason?: string
  replacementHint?: string
  count?: number
  limit?: number
}

export type CheckSummary = {
  totalFindings: number
  high: number
  medium: number
  low: number
}

export type CheckResult = {
  summary: CheckSummary
  findings: Finding[]
  markdownReport: string
}
