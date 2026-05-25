export type PageStatus =
  | 'ok'
  | 'robots_disallowed'
  | 'captcha_or_challenge'
  | 'login_required'
  | 'js_rendered_incomplete'
  | 'fetch_failed'
  | 'unsupported_content_type'

export type HeadingNode = {
  level: 1 | 2 | 3 | 4
  text: string
}

export type CapturePageType = 'official' | 'law firm' | 'visa agency' | 'blog' | 'forum' | 'other' | ''

export type Capture = {
  id: string
  capturedAt: string
  url: string
  domain: string
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
  keyword: string
  serpPosition: string
  country: string
  pageType: CapturePageType
  notes: string
  strengthTag: string
  weaknessTag: string
}

export type PageResult = {
  id: string
  url: string
  domain: string
  httpStatus: number | null
  fetchedAt: string             // ISO timestamp
  status: PageStatus
  title: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  robotsMeta: string | null
  headingOutline: HeadingNode[]
  excerpt: string | null        // max 200 words
  wordCount: number | null
  schemaTypes: string[]
  internalLinkCount: number | null
  externalLinkCount: number | null
  keyword: string
  serpPosition: string
  notes: string
}
