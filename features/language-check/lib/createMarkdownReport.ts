import type { ArticleType, CheckResult, Finding, FindingCategory } from './types'

function articleTypeLabel(t: ArticleType): string {
  const map: Record<ArticleType, string> = {
    procedure: 'Procedure',
    'living-insights': 'Living Insights',
    'living-cost': 'Living Cost',
  }
  return map[t]
}

function by(findings: Finding[], cat: FindingCategory): Finding[] {
  return findings.filter(f => f.category === cat)
}

function cell(v: string | number | undefined): string {
  return String(v ?? '').replace(/\|/g, '\\|')
}

function vocabTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f =>
    `| ${cell(f.section)} | ${cell(f.matchedText)} | ${f.severity} | ${cell(f.surroundingText)} | ${cell(f.replacementHint)} |`
  )
  return ['| Section | Flag | Severity | Text | Replacement hint |', '|---|---|---|---|---|', ...rows].join('\n') + '\n'
}

function overuseTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${f.count ?? 0} | ${f.limit ?? 0} |`)
  return ['| Word | Count | Limit |', '|---|---:|---:|', ...rows].join('\n') + '\n'
}

function aiTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f =>
    `| ${cell(f.section)} | ${cell(f.matchedText)} | ${f.severity} | ${cell(f.surroundingText)} |`
  )
  return ['| Section | Pattern | Severity | Text |', '|---|---|---|---|', ...rows].join('\n') + '\n'
}

function phraseFamilyTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${f.count ?? 0} | ${cell(f.surroundingText)} |`)
  return ['| Pattern family | Count | Examples |', '|---|---:|---|', ...rows].join('\n') + '\n'
}

function starterTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${cell(f.reason)} | ${f.count ?? 0} |`)
  return ['| Starter | Type | Count |', '|---|---|---:|', ...rows].join('\n') + '\n'
}

function restatementTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${cell(f.surroundingText)} |`)
  return ['| Heading | First sentence |', '|---|---|', ...rows].join('\n') + '\n'
}

function closingTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.section)} | ${cell(f.matchedText)} | ${cell(f.reason)} |`)
  return ['| Section | Matched text | Reason |', '|---|---|---|', ...rows].join('\n') + '\n'
}

function abstractTable(items: Finding[]): string {
  if (!items.length) return '_None found._\n'
  const rows = items.map(f => `| ${cell(f.matchedText)} | ${f.count ?? 0} | ${cell(f.reason)} |`)
  return ['| Word | Count | Reason |', '|---|---:|---|', ...rows].join('\n') + '\n'
}

export function createMarkdownReport({
  findings,
  summary,
  articleType,
}: Pick<CheckResult, 'findings' | 'summary'> & { articleType: ArticleType }): string {
  return [
    '# Language Check Report',
    '',
    `Article type: ${articleTypeLabel(articleType)}`,
    '',
    '## Summary',
    '',
    `Total findings: ${summary.totalFindings}  `,
    `High: ${summary.high}  `,
    `Medium: ${summary.medium}  `,
    `Low: ${summary.low}  `,
    '',
    '## Vocabulary Flags',
    '',
    vocabTable(by(findings, 'vocabulary')),
    '## Overused Words',
    '',
    overuseTable(by(findings, 'overuse')),
    '## AI-Cadence Patterns',
    '',
    aiTable(by(findings, 'ai-pattern')),
    '## Phrase Family Patterns',
    '',
    phraseFamilyTable(by(findings, 'phrase-family')),
    '## Repeated Sentence Starters',
    '',
    starterTable(by(findings, 'sentence-starter')),
    '## Heading Restatements',
    '',
    restatementTable(by(findings, 'heading-restatement')),
    '## Tidy Closings',
    '',
    closingTable(by(findings, 'tidy-closing')),
    '## Abstract / Formal Wording Count',
    '',
    abstractTable(by(findings, 'abstract-wording')),
  ].join('\n')
}
