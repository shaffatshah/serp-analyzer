import type { PageResult } from './types'

export function exportToJson(results: PageResult[]): string {
  return JSON.stringify(results, null, 2)
}

export function exportToCsv(results: PageResult[]): string {
  const headers = [
    'url', 'domain', 'httpStatus', 'fetchedAt', 'status',
    'title', 'metaDescription', 'canonicalUrl', 'robotsMeta',
    'headingOutline', 'excerpt', 'wordCount', 'schemaTypes',
    'internalLinkCount', 'externalLinkCount', 'keyword', 'serpPosition', 'notes',
  ]

  const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`

  const rows = results.map(r => [
    r.url,
    r.domain,
    r.httpStatus ?? '',
    r.fetchedAt,
    r.status,
    r.title ?? '',
    r.metaDescription ?? '',
    r.canonicalUrl ?? '',
    r.robotsMeta ?? '',
    r.headingOutline.map(h => `H${h.level}: ${h.text}`).join(' | '),
    r.excerpt ?? '',
    r.wordCount ?? '',
    r.schemaTypes.join(' | '),
    r.internalLinkCount ?? '',
    r.externalLinkCount ?? '',
    r.keyword,
    r.serpPosition,
    r.notes,
  ].map(escape).join(','))

  return [headers.join(','), ...rows].join('\n')
}

export function exportToMarkdown(results: PageResult[]): string {
  return results.map(r => {
    const lines: string[] = [`## ${r.title ?? r.url}`, '']
    lines.push(`**URL:** ${r.url}  `)
    lines.push(`**Domain:** ${r.domain}  `)
    lines.push(`**Status:** ${r.status}  `)
    if (r.httpStatus) lines.push(`**HTTP:** ${r.httpStatus}  `)
    if (r.metaDescription) lines.push(`**Meta description:** ${r.metaDescription}  `)
    if (r.canonicalUrl) lines.push(`**Canonical:** ${r.canonicalUrl}  `)
    if (r.wordCount) lines.push(`**Word count:** ${r.wordCount}  `)
    if (r.schemaTypes.length) lines.push(`**Schema:** ${r.schemaTypes.join(', ')}  `)
    if (r.internalLinkCount !== null) lines.push(`**Internal links:** ${r.internalLinkCount}  `)
    if (r.externalLinkCount !== null) lines.push(`**External links:** ${r.externalLinkCount}  `)
    if (r.keyword) lines.push(`**Keyword:** ${r.keyword}  `)
    if (r.serpPosition) lines.push(`**SERP position:** ${r.serpPosition}  `)
    if (r.notes) lines.push(`**Notes:** ${r.notes}  `)

    if (r.headingOutline.length) {
      lines.push('', '### Heading outline', '')
      r.headingOutline.forEach(h => {
        lines.push(`${'  '.repeat(h.level - 1)}- H${h.level}: ${h.text}`)
      })
    }

    if (r.excerpt) {
      lines.push('', '### Excerpt', '', r.excerpt)
    }

    return lines.join('\n')
  }).join('\n\n---\n\n')
}
