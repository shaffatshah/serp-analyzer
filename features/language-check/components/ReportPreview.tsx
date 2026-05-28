'use client'

import { useState } from 'react'

type Props = {
  report: string
}

export function ReportPreview({ report }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Markdown Report</h2>
        <button
          onClick={handleCopy}
          className="text-sm px-3 py-1.5 border border-border rounded hover:bg-muted transition-colors"
        >
          {copied ? 'Copied!' : 'Copy report'}
        </button>
      </div>
      <pre className="text-xs bg-muted/40 border border-border rounded p-4 overflow-x-auto whitespace-pre-wrap font-mono max-h-96">
        {report}
      </pre>
    </div>
  )
}
