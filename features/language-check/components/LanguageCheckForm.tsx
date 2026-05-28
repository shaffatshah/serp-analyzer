'use client'

import type { ArticleType } from '../lib/types'

type Props = {
  markdown: string
  articleType: ArticleType
  loading: boolean
  onMarkdownChange: (v: string) => void
  onArticleTypeChange: (v: ArticleType) => void
  onRun: () => void
  onClear: () => void
}

const ARTICLE_TYPE_OPTIONS: { value: ArticleType; label: string }[] = [
  { value: 'procedure', label: 'Procedure' },
  { value: 'living-insights', label: 'Living Insights' },
  { value: 'living-cost', label: 'Living Cost' },
]

export function LanguageCheckForm({
  markdown,
  articleType,
  loading,
  onMarkdownChange,
  onArticleTypeChange,
  onRun,
  onClear,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium shrink-0">Article type</label>
        <select
          value={articleType}
          onChange={e => onArticleTypeChange(e.target.value as ArticleType)}
          className="border border-input rounded px-3 py-1.5 text-sm bg-background"
        >
          {ARTICLE_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <textarea
        value={markdown}
        onChange={e => onMarkdownChange(e.target.value)}
        placeholder="Paste Markdown article here…"
        rows={14}
        className="w-full border border-input rounded px-3 py-2 text-sm bg-background font-mono resize-y"
      />

      <div className="flex gap-2">
        <button
          onClick={onRun}
          disabled={loading || !markdown.trim()}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Scanning…' : 'Run Check'}
        </button>
        <button
          onClick={onClear}
          disabled={!markdown.trim()}
          className="px-4 py-2 text-sm border border-border rounded hover:bg-muted disabled:opacity-40 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
