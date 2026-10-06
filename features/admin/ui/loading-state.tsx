import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div className="loading-state flex items-center gap-2" role="status">
      <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
      {children}
    </div>
  )
}
