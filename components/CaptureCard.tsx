'use client'

import { useState } from 'react'
import type { Capture, CapturePageType } from '@/lib/types'
import { HeadingTree } from './HeadingTree'
import { cn } from '@/lib/utils'

type Props = {
  capture: Capture
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Capture>) => void
}

const PAGE_TYPES: CapturePageType[] = ['', 'official', 'law firm', 'visa agency', 'blog', 'forum', 'other']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

export function CaptureCard({ capture, onDelete, onUpdate }: Props) {
  const [local, setLocal] = useState(capture)

  function handleChange(field: keyof Capture, value: string) {
    setLocal(prev => ({ ...prev, [field]: value }))
  }

  function handleBlur(field: keyof Capture) {
    onUpdate(capture.id, { [field]: local[field] })
  }

  function handlePageTypeChange(value: CapturePageType) {
    setLocal(prev => ({ ...prev, pageType: value }))
    onUpdate(capture.id, { pageType: value })
  }

  const timeAgo = (() => {
    const diff = Math.floor((Date.now() - new Date(capture.capturedAt).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  })()

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-medium truncate">{capture.domain}</span>
          <span className="text-muted-foreground shrink-0">· {timeAgo}</span>
          {capture.keyword && (
            <span className="text-muted-foreground shrink-0 truncate">· {capture.keyword}</span>
          )}
        </div>
        <button
          onClick={() => onDelete(capture.id)}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-4 shrink-0"
        >
          Remove
        </button>
      </div>

      <Section title="Page data">
        <div className="space-y-0.5 mb-3">
          <MetaRow label="URL" value={<a href={capture.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{capture.url}</a>} />
          <MetaRow label="Title" value={capture.title} />
          <MetaRow label="Meta description" value={capture.metaDescription} />
          <MetaRow label="Canonical" value={capture.canonicalUrl} />
          <MetaRow label="Robots meta" value={capture.robotsMeta} />
          <MetaRow label="Schema types" value={capture.schemaTypes.join(', ') || null} />
          <MetaRow label="Word count" value={capture.wordCount?.toLocaleString()} />
          <MetaRow label="Internal links" value={capture.internalLinkCount} />
          <MetaRow label="External links" value={capture.externalLinkCount} />
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Keyword</label>
              <input
                type="text"
                value={local.keyword}
                onChange={(e) => handleChange('keyword', e.target.value)}
                onBlur={() => handleBlur('keyword')}
                className="w-full text-sm border border-input rounded px-2 py-1 bg-background"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">SERP position</label>
              <input
                type="text"
                value={local.serpPosition}
                onChange={(e) => handleChange('serpPosition', e.target.value)}
                onBlur={() => handleBlur('serpPosition')}
                className="w-full text-sm border border-input rounded px-2 py-1 bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Country / language</label>
              <input
                type="text"
                value={local.country}
                onChange={(e) => handleChange('country', e.target.value)}
                onBlur={() => handleBlur('country')}
                placeholder="e.g. Thailand, EN"
                className="w-full text-sm border border-input rounded px-2 py-1 bg-background"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Page type</label>
              <select
                value={local.pageType}
                onChange={(e) => handlePageTypeChange(e.target.value as CapturePageType)}
                className="w-full text-sm border border-input rounded px-2 py-1 bg-background"
              >
                {PAGE_TYPES.map(t => (
                  <option key={t} value={t}>{t || '— select —'}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Strength</label>
              <input
                type="text"
                value={local.strengthTag}
                onChange={(e) => handleChange('strengthTag', e.target.value)}
                onBlur={() => handleBlur('strengthTag')}
                placeholder="e.g. Strong trust signals"
                className="w-full text-sm border border-input rounded px-2 py-1 bg-background"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Weakness</label>
              <input
                type="text"
                value={local.weaknessTag}
                onChange={(e) => handleChange('weaknessTag', e.target.value)}
                onBlur={() => handleBlur('weaknessTag')}
                placeholder="e.g. Missing cost info"
                className="w-full text-sm border border-input rounded px-2 py-1 bg-background"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notes</label>
            <textarea
              value={local.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              onBlur={() => handleBlur('notes')}
              rows={2}
              placeholder="Search intent angle, useful sections, missing content..."
              className="w-full text-sm border border-input rounded px-2 py-1 bg-background resize-none"
            />
          </div>
        </div>
      </Section>

      <Section title="Heading outline">
        <HeadingTree headings={capture.headingOutline} />
      </Section>

      <Section title="Excerpt">
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {capture.excerpt ?? 'No visible text captured.'}
        </p>
      </Section>
    </div>
  )
}
