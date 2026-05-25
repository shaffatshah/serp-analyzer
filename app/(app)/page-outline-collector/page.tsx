'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Capture } from '@/lib/types'
import { CaptureCard } from '@/components/CaptureCard'
import {
  exportCapturesToMarkdown,
  exportCapturesToCsv,
  exportCapturesToJson,
} from '@/lib/export'

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function ComparisonTable({ captures }: { captures: Capture[] }) {
  if (captures.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 font-medium border border-border whitespace-nowrap">SERP Pos</th>
            <th className="text-left px-3 py-2 font-medium border border-border whitespace-nowrap">Domain</th>
            <th className="text-left px-3 py-2 font-medium border border-border">Title</th>
            <th className="text-left px-3 py-2 font-medium border border-border">H1</th>
            <th className="text-left px-3 py-2 font-medium border border-border">Main H2s</th>
            <th className="text-left px-3 py-2 font-medium border border-border whitespace-nowrap">Word Count</th>
            <th className="text-left px-3 py-2 font-medium border border-border whitespace-nowrap">Page Type</th>
            <th className="text-left px-3 py-2 font-medium border border-border">Notes</th>
          </tr>
        </thead>
        <tbody>
          {captures.map(c => {
            const h1 = c.headingOutline.find(h => h.level === 1)?.text ?? ''
            const h2s = c.headingOutline.filter(h => h.level === 2).map(h => h.text)
            return (
              <tr key={c.id} className="hover:bg-muted/20">
                <td className="px-3 py-2 border border-border text-center">{c.serpPosition || '—'}</td>
                <td className="px-3 py-2 border border-border font-medium whitespace-nowrap">{c.domain}</td>
                <td className="px-3 py-2 border border-border max-w-[200px] truncate" title={c.title ?? ''}>{c.title ?? '—'}</td>
                <td className="px-3 py-2 border border-border max-w-[180px]">{h1 || '—'}</td>
                <td className="px-3 py-2 border border-border max-w-[280px]">
                  {h2s.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5">
                      {h2s.slice(0, 6).map((h, i) => <li key={i} className="truncate text-xs">{h}</li>)}
                      {h2s.length > 6 && <li className="text-muted-foreground text-xs">+{h2s.length - 6} more</li>}
                    </ul>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 border border-border text-center">{c.wordCount?.toLocaleString() ?? '—'}</td>
                <td className="px-3 py-2 border border-border">{c.pageType || '—'}</td>
                <td className="px-3 py-2 border border-border max-w-[180px] text-xs text-muted-foreground">{c.notes || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PageOutlineCollector() {
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/captures')
      .then(r => r.json())
      .then(setCaptures)
      .catch(() => setError('Failed to load captures'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/captures/${id}`, { method: 'DELETE' })
    setCaptures(prev => prev.filter(c => c.id !== id))
  }, [])

  const handleUpdate = useCallback(async (id: string, patch: Partial<Capture>) => {
    const res = await fetch(`/api/captures/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated: Capture = await res.json()
      setCaptures(prev => prev.map(c => c.id === id ? updated : c))
    }
  }, [])

  const sorted = [...captures].sort((a, b) => {
    const pa = parseInt(a.serpPosition) || 999
    const pb = parseInt(b.serpPosition) || 999
    return pa - pb
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Page Outline Collector</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Captures sent from the Chrome extension. Add keyword and SERP position, then export.
          </p>
        </div>
        {captures.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadFile(exportCapturesToMarkdown(sorted), 'serp-captures.md', 'text/markdown')}
              className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors"
            >
              Export MD
            </button>
            <button
              onClick={() => downloadFile(exportCapturesToCsv(sorted), 'serp-captures.csv', 'text/csv')}
              className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => downloadFile(exportCapturesToJson(sorted), 'serp-captures.json', 'application/json')}
              className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors"
            >
              Export JSON
            </button>
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading captures…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && captures.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">No captures yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Open a SERP result in Chrome, then click the extension icon to capture the page.
          </p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-4">
          {sorted.map(c => (
            <CaptureCard
              key={c.id}
              capture={c}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {sorted.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Comparison</h2>
          <ComparisonTable captures={sorted} />
        </div>
      )}
    </div>
  )
}
