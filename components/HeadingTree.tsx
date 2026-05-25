import type { HeadingNode } from '@/lib/types'

type Props = {
  headings: HeadingNode[]
}

export function HeadingTree({ headings }: Props) {
  if (headings.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No headings found.</p>
  }

  return (
    <ul className="space-y-1 text-sm font-mono">
      {headings.map((h, i) => (
        <li
          key={i}
          style={{ paddingLeft: `${(h.level - 1) * 16}px` }}
          className="flex gap-1.5"
        >
          <span className="text-muted-foreground shrink-0 w-6">H{h.level}</span>
          <span className="text-foreground">{h.text}</span>
        </li>
      ))}
    </ul>
  )
}
