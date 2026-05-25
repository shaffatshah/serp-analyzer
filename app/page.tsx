'use client'

import { useState } from 'react'
import type { PageResult } from '@/lib/types'
import { ResultCard } from '@/components/ResultCard'
import { exportToJson, exportToCsv, exportToMarkdown } from '@/lib/export'

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [keyword, setKeyword] = useState('')
  const [position, setPosition] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<PageResult[]>([])

  async function handleAnalyze() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Request failed')
        return
      }

      const result: PageResult = await res.json()
      result.keyword = keyword
      result.serpPosition = position

      setResults(prev => [result, ...prev])
      setUrl('')
      setKeyword('')
      setPosition('')
    } catch {
      setError('Network error — is the dev server running?')
    } finally {
      setLoading(false)
    }
  }

  function handleRemove(id: string) {
    setResults(prev => prev.filter(r => r.id !== id))
  }

  function handleUpdate(
    id: string,
    patch: Partial<Pick<PageResult, 'keyword' | 'serpPosition' | 'notes'>>
  ) {
    setResults(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  const isEmpty = results.length === 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-semibold">SERP Page Overview</h1>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Paste URL here..."
            className="flex-1 border border-input rounded px-3 py-2 text-sm bg-background"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword (optional)"
            className="flex-1 border border-input rounded px-3 py-2 text-sm bg-background"
          />
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="SERP position (optional)"
            className="w-44 border border-input rounded px-3 py-2 text-sm bg-background"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Export */}
      <div className="flex gap-2">
        {[
          { label: 'Export MD', fn: () => downloadFile(exportToMarkdown(results), 'serp-research.md', 'text/markdown') },
          { label: 'Export CSV', fn: () => downloadFile(exportToCsv(results), 'serp-research.csv', 'text/csv') },
          { label: 'Export JSON', fn: () => downloadFile(exportToJson(results), 'serp-research.json', 'application/json') },
        ].map(({ label, fn }) => (
          <button
            key={label}
            onClick={fn}
            disabled={isEmpty}
            className="text-sm px-3 py-1.5 border border-border rounded hover:bg-muted disabled:opacity-40 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.map(r => (
          <ResultCard
            key={r.id}
            result={r}
            onRemove={handleRemove}
            onUpdate={handleUpdate}
          />
        ))}
        {isEmpty && (
          <p className="text-sm text-muted-foreground text-center py-16">
            Paste a URL above to get started.
          </p>
        )}
      </div>
    </div>
  )
}
