import { remark } from 'remark'
import { toString } from 'mdast-util-to-string'
import type { Root, RootContent } from 'mdast'

export type ParsedSection = {
  heading: { level: 2 | 3; text: string } | null
  rawText: string
  sentences: string[]
  lastParagraph: string | null
}

export type ParsedArticle = {
  fullText: string
  sections: ParsedSection[]
  allSentences: string[]
}

const TEXT_NODE_TYPES = new Set(['paragraph', 'list', 'blockquote'])

function extractSentences(text: string): string[] {
  const result: string[] = []
  for (const para of text.split(/\n\n+/)) {
    const line = para.replace(/\n/g, ' ').trim()
    if (!line) continue
    const parts = line.split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    for (const part of parts) {
      const t = part.trim()
      if (t.length > 5) result.push(t)
    }
  }
  return result
}

export function parseMarkdown(markdown: string): ParsedArticle {
  const ast = remark().parse(markdown) as Root
  const sections: ParsedSection[] = []

  let currentHeading: { level: 2 | 3; text: string } | null = null
  let currentNodes: RootContent[] = []

  function flush() {
    const paragraphTexts = currentNodes
      .filter(n => TEXT_NODE_TYPES.has(n.type))
      .map(n => toString(n).trim())
      .filter(Boolean)

    const rawText = paragraphTexts.join('\n\n')
    const sentences = extractSentences(rawText)
    const lastParagraph = paragraphTexts.at(-1) ?? null

    sections.push({ heading: currentHeading, rawText, sentences, lastParagraph })
  }

  for (const node of ast.children) {
    if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
      if (currentNodes.length || currentHeading !== null) flush()
      currentHeading = { level: node.depth as 2 | 3, text: toString(node) }
      currentNodes = []
    } else {
      currentNodes.push(node)
    }
  }

  if (currentNodes.length || currentHeading !== null) flush()

  const allSentences = sections.flatMap(s => s.sentences)
  const fullText = sections.map(s => s.rawText).join('\n\n')

  return { fullText, sections, allSentences }
}
