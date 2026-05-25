import * as cheerio from 'cheerio'
import type { Element } from 'domhandler'
import type { HeadingNode } from './types'

export type ParsedPage = {
  title: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  robotsMeta: string | null
  headingOutline: HeadingNode[]
  excerpt: string | null
  wordCount: number | null
  schemaTypes: string[]
  internalLinkCount: number
  externalLinkCount: number
}

export function parseHtml(html: string, pageUrl: string): ParsedPage {
  const $ = cheerio.load(html)
  const domain = new URL(pageUrl).hostname

  // Extract schema types BEFORE removing script tags
  const schemaTypes: string[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}')
      const type = data['@type']
      if (type) schemaTypes.push(Array.isArray(type) ? type.join(', ') : String(type))
    } catch {}
  })

  $('script, style, nav, footer, header, noscript').remove()

  const title = $('title').first().text().trim() || null
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null
  const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || null
  const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || null

  const headingOutline: HeadingNode[] = []
  $('h1, h2, h3, h4').each((_, el) => {
    const tag = (el as Element).tagName.toLowerCase()
    const level = parseInt(tag[1]) as 1 | 2 | 3 | 4
    const text = $(el).text().trim()
    if (text) headingOutline.push({ level, text })
  })

  let internalLinkCount = 0
  let externalLinkCount = 0
  // Count link references after scripts removed
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    try {
      const linkUrl = new URL(href, pageUrl)
      if (linkUrl.hostname === domain) {
        internalLinkCount++
      } else {
        externalLinkCount++
      }
    } catch {}
  })

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const words = bodyText.split(' ').filter(Boolean)
  const wordCount = words.length > 0 ? words.length : null
  const excerpt = wordCount !== null ? words.slice(0, 200).join(' ') : null

  return {
    title,
    metaDescription,
    canonicalUrl,
    robotsMeta,
    headingOutline,
    excerpt,
    wordCount,
    schemaTypes,
    internalLinkCount,
    externalLinkCount,
  }
}

export function isJsRenderedIncomplete(wordCount: number | null): boolean {
  return wordCount === null || wordCount < 100
}
