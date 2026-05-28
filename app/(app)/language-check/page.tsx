'use client'

import { useState } from 'react'
import type { ArticleType, CheckResult } from '@/features/language-check/lib/types'
import { runLanguageCheck } from '@/features/language-check/lib/runLanguageCheck'
import { LanguageCheckForm } from '@/features/language-check/components/LanguageCheckForm'
import { LanguageCheckResults } from '@/features/language-check/components/LanguageCheckResults'
import { ReportPreview } from '@/features/language-check/components/ReportPreview'

export default function LanguageCheckPage() {
  const [markdown, setMarkdown] = useState('')
  const [articleType, setArticleType] = useState<ArticleType>('procedure')
  const [result, setResult] = useState<CheckResult | null>(null)

  function handleRun() {
    if (!markdown.trim()) return
    const r = runLanguageCheck({ markdown, articleType })
    setResult(r)
  }

  function handleClear() {
    setMarkdown('')
    setResult(null)
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Language Check</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scan an article for vocabulary flags, AI-style phrasing, repeated patterns, and weak section endings.
        </p>
      </div>

      <LanguageCheckForm
        markdown={markdown}
        articleType={articleType}
        loading={false}
        onMarkdownChange={setMarkdown}
        onArticleTypeChange={setArticleType}
        onRun={handleRun}
        onClear={handleClear}
      />

      {result && (
        <>
          <LanguageCheckResults result={result} />
          <ReportPreview report={result.markdownReport} />
        </>
      )}
    </div>
  )
}
