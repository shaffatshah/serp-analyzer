import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parseHtml, isJsRenderedIncomplete } from '@/lib/parser'
import { isRobotsAllowed } from '@/lib/robots'
import type { PageResult, PageStatus } from '@/lib/types'

const USER_AGENT = 'AsiaLongStay-SERP-Research/1.0 (local research tool; not a crawler)'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const url: string = body?.url ?? ''

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'URL must be http or https' }, { status: 400 })
  }

  if (/google\./i.test(parsed.hostname)) {
    return NextResponse.json({ error: 'Google URLs are not supported' }, { status: 400 })
  }

  const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[::1\])/i
  if (PRIVATE_HOST.test(parsed.hostname)) {
    return NextResponse.json({ error: 'Private addresses are not allowed' }, { status: 400 })
  }

  const domain = parsed.hostname
  const allowed = await isRobotsAllowed(url)

  if (!allowed) {
    return NextResponse.json(makeBlocked(url, domain, 'robots_disallowed'))
  }

  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    })
  } catch {
    return NextResponse.json(makeBlocked(url, domain, 'fetch_failed'))
  }

  if (!res.ok) {
    return NextResponse.json(makeBlocked(url, domain, 'fetch_failed', res.status))
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) {
    return NextResponse.json(makeBlocked(url, domain, 'unsupported_content_type', res.status))
  }

  const finalPath = new URL(res.url).pathname
  if (/^\/(login|signin|sign-in|auth)(\/|$|\?)/i.test(finalPath)) {
    return NextResponse.json(makeBlocked(url, domain, 'login_required', res.status))
  }

  const html = await res.text()
  const lower = html.toLowerCase()

  if (
    html.length < 5000 &&
    (lower.includes('captcha') || lower.includes('cf-challenge') || lower.includes('are you a robot'))
  ) {
    return NextResponse.json(makeBlocked(url, domain, 'captcha_or_challenge', res.status))
  }

  if (html.length < 10000 && lower.includes('<form') && lower.includes('password')) {
    return NextResponse.json(makeBlocked(url, domain, 'login_required', res.status))
  }

  const page = parseHtml(html, url)
  const status: PageStatus = isJsRenderedIncomplete(page.wordCount) ? 'js_rendered_incomplete' : 'ok'

  const result: PageResult = {
    id: crypto.randomUUID(),
    url,
    domain,
    httpStatus: res.status,
    fetchedAt: new Date().toISOString(),
    status,
    ...page,
    keyword: '',
    serpPosition: '',
    notes: '',
  }

  return NextResponse.json(result)
}

function makeBlocked(
  url: string,
  domain: string,
  status: PageStatus,
  httpStatus: number | null = null
): PageResult {
  return {
    id: crypto.randomUUID(),
    url,
    domain,
    httpStatus,
    fetchedAt: new Date().toISOString(),
    status,
    title: null,
    metaDescription: null,
    canonicalUrl: null,
    robotsMeta: null,
    headingOutline: [],
    excerpt: null,
    wordCount: null,
    schemaTypes: [],
    internalLinkCount: null,
    externalLinkCount: null,
    keyword: '',
    serpPosition: '',
    notes: '',
  }
}
