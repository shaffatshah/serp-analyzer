'use client'

import { useState } from 'react'
import type { PageResult } from '@/lib/types'
import { HeadingTree } from './HeadingTree'

type Props = {
  result: PageResult
  onRemove: (id: string) => void
  onUpdate: (id: string, patch: Partial<Pick<PageResult, 'keyword' | 'serpPosition' | 'notes'>>) => void
}

const STATUS_LABELS: Record<string, string> = {
  robots_disallowed: 'Blocked: robots.txt disallowed this path',
  captcha_or_challenge: 'Blocked: CAPTCHA or bot challenge detected',
  login_required: 'Blocked: login wall detected',
  fetch_failed: 'Fetch failed — server unreachable or returned an error',
  unsupported_content_type: 'Unsupported content type (not HTML)',
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors text-left"
      >
        <span>{title}</span>
        <span className="text-muted-foreground text-xs">{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-0.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  )
}

export function ResultCard({ result, onRemove, onUpdate }: Props) {
  const isHardBlocked =
    result.status !== 'ok' && result.status !== 'js_rendered_incomplete'

  const timeAgo = (() => {
    const diff = Math.floor((Date.now() - new Date(result.fetchedAt).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  })()

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-medium truncate">{result.domain}</span>
          {result.httpStatus && (
            <span className="text-muted-foreground shrink-0">· {result.httpStatus}</span>
          )}
          <span className="text-muted-foreground shrink-0">· {timeAgo}</span>
        </div>
        <button
          onClick={() => onRemove(result.id)}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-4 shrink-0"
        >
          Remove
        </button>
      </div>

      {/* Hard blocked */}
      {isHardBlocked && (
        <div className="px-4 py-3 text-sm">
          <p className="text-destructive font-medium">
            {STATUS_LABELS[result.status] ?? result.status}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Extract this page manually in your browser if needed.
          </p>
        </div>
      )}

      {/* JS incomplete warning */}
      {result.status === 'js_rendered_incomplete' && (
        <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400">
          JS-rendered page — static HTML is incomplete. Results may be partial.
        </div>
      )}

      {/* Content sections — shown for ok and js_rendered_incomplete */}
      {!isHardBlocked && (
        <>
          <Section title="Metadata">
            <div className="space-y-0.5 mb-3">
              <MetaRow label="Title" value={result.title} />
              <MetaRow label="Meta description" value={result.metaDescription} />
              <MetaRow label="Canonical" value={result.canonicalUrl} />
              <MetaRow label="Robots meta" value={result.robotsMeta} />
              <MetaRow label="Schema types" value={result.schemaTypes.join(', ') || null} />
              <MetaRow label="Word count" value={result.wordCount?.toLocaleString()} />
              <MetaRow label="Internal links" value={result.internalLinkCount} />
              <MetaRow label="External links" value={result.externalLinkCount} />
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Keyword</label>
                  <input
                    type="text"
                    value={result.keyword}
                    onChange={(e) => onUpdate(result.id, { keyword: e.target.value })}
                    placeholder="target keyword"
                    className="w-full text-sm border border-input rounded px-2 py-1 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">SERP position</label>
                  <input
                    type="text"
                    value={result.serpPosition}
                    onChange={(e) => onUpdate(result.id, { serpPosition: e.target.value })}
                    placeholder="#"
                    className="w-full text-sm border border-input rounded px-2 py-1 bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                <textarea
                  value={result.notes}
                  onChange={(e) => onUpdate(result.id, { notes: e.target.value })}
                  placeholder="your notes..."
                  rows={2}
                  className="w-full text-sm border border-input rounded px-2 py-1 bg-background resize-none"
                />
              </div>
            </div>
          </Section>

          <Section title="Heading outline">
            <HeadingTree headings={result.headingOutline} />
          </Section>

          <Section title="Excerpt">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {result.excerpt ?? 'No visible text extracted.'}
            </p>
          </Section>
        </>
      )}
    </div>
  )
}
