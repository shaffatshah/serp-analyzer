import { Sidebar } from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="h-14 border-b shrink-0 flex items-center px-6">
        <div className="w-8 h-8 rounded bg-muted" />
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
