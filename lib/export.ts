import type { Capture, PageResult } from './types'

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

// Capture exports

export function exportCapturesToJson(captures: Capture[]): string {
  return JSON.stringify(captures, null, 2)
}

export function exportCapturesToCsv(captures: Capture[]): string {
  const headers = [
    'capturedAt', 'url', 'domain', 'keyword', 'serpPosition', 'country', 'pageType',
    'title', 'metaDescription', 'canonicalUrl', 'robotsMeta',
    'headingOutline', 'excerpt', 'wordCount', 'schemaTypes',
    'internalLinkCount', 'externalLinkCount',
    'notes', 'strengthTag', 'weaknessTag',
  ]

  const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`

  const rows = captures.map(c => [
    c.capturedAt,
    c.url,
    c.domain,
    c.keyword,
    c.serpPosition,
    c.country,
    c.pageType,
    c.title ?? '',
    c.metaDescription ?? '',
    c.canonicalUrl ?? '',
    c.robotsMeta ?? '',
    c.headingOutline.map(h => `H${h.level}: ${h.text}`).join(' | '),
    c.excerpt ?? '',
    c.wordCount ?? '',
    c.schemaTypes.join(' | '),
    c.internalLinkCount,
    c.externalLinkCount,
    c.notes,
    c.strengthTag,
    c.weaknessTag,
  ].map(escape).join(','))

  return [headers.join(','), ...rows].join('\n')
}

export function exportCapturesToMarkdown(captures: Capture[]): string {
  return captures.map(c => {
    const lines: string[] = [`## ${c.title ?? c.url}`, '']
    lines.push(`**URL:** ${c.url}  `)
    lines.push(`**Domain:** ${c.domain}  `)
    if (c.keyword) lines.push(`**Keyword:** ${c.keyword}  `)
    if (c.serpPosition) lines.push(`**SERP position:** ${c.serpPosition}  `)
    if (c.country) lines.push(`**Country / language:** ${c.country}  `)
    if (c.pageType) lines.push(`**Page type:** ${c.pageType}  `)
    if (c.metaDescription) lines.push(`**Meta description:** ${c.metaDescription}  `)
    if (c.canonicalUrl) lines.push(`**Canonical:** ${c.canonicalUrl}  `)
    if (c.wordCount) lines.push(`**Word count:** ${c.wordCount}  `)
    if (c.schemaTypes.length) lines.push(`**Schema:** ${c.schemaTypes.join(', ')}  `)
    lines.push(`**Internal links:** ${c.internalLinkCount}  `)
    lines.push(`**External links:** ${c.externalLinkCount}  `)
    if (c.notes) lines.push(`**Notes:** ${c.notes}  `)
    if (c.strengthTag) lines.push(`**Strength:** ${c.strengthTag}  `)
    if (c.weaknessTag) lines.push(`**Weakness:** ${c.weaknessTag}  `)

    if (c.headingOutline.length) {
      lines.push('', '### Heading outline', '')
      c.headingOutline.forEach(h => {
        lines.push(`${'  '.repeat(h.level - 1)}- H${h.level}: ${h.text}`)
      })
    }

    if (c.excerpt) {
      lines.push('', '### Excerpt', '', c.excerpt)
    }

    return lines.join('\n')
  }).join('\n\n---\n\n')
}
