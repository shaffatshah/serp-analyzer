'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Page Overview', href: '/page-overview' },
  { label: 'Page Outline Collector', href: '/page-outline-collector' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="w-52 border-r shrink-0 flex flex-col gap-1 p-3">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'px-3 py-2 rounded text-sm transition-colors',
            pathname === item.href
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
