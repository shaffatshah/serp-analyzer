'use client'

import type { CheckResult, Finding, FindingCategory } from '../lib/types'

const SEVERITY_COLORS: Record<string, string> = {
  high: 'text-destructive',
  medium: 'text-yellow-600',
  low: 'text-muted-foreground',
}

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  vocabulary: 'Vocabulary Flags',
  overuse: 'Overused Words',
  'ai-pattern': 'AI-Cadence Patterns',
  'phrase-family': 'Phrase Family Patterns',
  'sentence-starter': 'Repeated Sentence Starters',
  'heading-restatement': 'Heading Restatements',
  'tidy-closing': 'Tidy Closings',
  'abstract-wording': 'Abstract / Formal Wording',
}

const CATEGORY_ORDER: FindingCategory[] = [
  'vocabulary', 'overuse', 'ai-pattern', 'phrase-family',
  'sentence-starter', 'heading-restatement', 'tidy-closing', 'abstract-wording',
]

function FindingRow({ f }: { f: Finding }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">{f.section ?? ''}</td>
      <td className={`py-1.5 pr-3 text-xs font-mono font-medium ${SEVERITY_COLORS[f.severity] ?? ''}`}>
        {f.matchedText}
        {f.count !== undefined && <span className="ml-1 text-muted-foreground">×{f.count}</span>}
        {f.limit !== undefined && <span className="ml-1 text-muted-foreground">(limit {f.limit})</span>}
      </td>
      <td className="py-1.5 pr-3 text-xs text-muted-foreground max-w-xs truncate" title={f.surroundingText}>
        {f.surroundingText ?? f.reason ?? ''}
      </td>
      <td className="py-1.5 text-xs text-muted-foreground">{f.replacementHint ?? ''}</td>
    </tr>
  )
}

function CategorySection({ category, findings }: { category: FindingCategory; findings: Finding[] }) {
  if (!findings.length) return null
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2">{CATEGORY_LABELS[category]}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <tbody>
            {findings.map(f => <FindingRow key={f.id} f={f} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type Props = {
  result: CheckResult
}

export function LanguageCheckResults({ result }: Props) {
  const { summary, findings } = result
  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-sm">
        <span>Total: <strong>{summary.totalFindings}</strong></span>
        <span className={SEVERITY_COLORS.high}>High: <strong>{summary.high}</strong></span>
        <span className={SEVERITY_COLORS.medium}>Medium: <strong>{summary.medium}</strong></span>
        <span className="text-muted-foreground">Low: <strong>{summary.low}</strong></span>
      </div>

      {CATEGORY_ORDER.map(cat => (
        <CategorySection
          key={cat}
          category={cat}
          findings={findings.filter(f => f.category === cat)}
        />
      ))}
    </div>
  )
}
