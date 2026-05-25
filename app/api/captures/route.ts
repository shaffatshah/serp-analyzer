import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addCapture, getCaptures } from '@/lib/captures-store'
import type { Capture } from '@/lib/types'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET() {
  return NextResponse.json(getCaptures(), { headers: CORS })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const capture: Capture = {
    id: crypto.randomUUID(),
    capturedAt: new Date().toISOString(),
    url: body.url ?? '',
    domain: body.domain ?? '',
    title: body.title ?? null,
    metaDescription: body.metaDescription ?? null,
    canonicalUrl: body.canonicalUrl ?? null,
    robotsMeta: body.robotsMeta ?? null,
    headingOutline: body.headingOutline ?? [],
    excerpt: body.excerpt ?? null,
    wordCount: body.wordCount ?? null,
    schemaTypes: body.schemaTypes ?? [],
    internalLinkCount: body.internalLinkCount ?? 0,
    externalLinkCount: body.externalLinkCount ?? 0,
    keyword: body.keyword ?? '',
    serpPosition: body.serpPosition ?? '',
    country: body.country ?? '',
    pageType: body.pageType ?? '',
    notes: '',
    strengthTag: '',
    weaknessTag: '',
  }

  addCapture(capture)
  return NextResponse.json(capture, { status: 201, headers: CORS })
}
