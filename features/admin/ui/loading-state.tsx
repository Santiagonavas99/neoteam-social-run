import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 rounded-control border border-neo-border bg-neo-surface px-6 py-8 text-sm text-neo-text-secondary"
      role="status"
    >
      <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
      {children}
    </div>
  )
}
