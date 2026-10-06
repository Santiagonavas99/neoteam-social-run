import { type LucideIcon, SearchX, X } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-card border border-dashed border-neo-border-strong bg-neo-surface px-6 py-14 text-center">
      <Icon aria-hidden className="mx-auto block size-8 text-neo-accent-text" />
      <h2 className="mt-5 mb-2 text-2xl font-bold tracking-[-0.04em]">{title}</h2>
      <p className="mx-auto mb-6 max-w-[460px] text-sm text-neo-text-secondary">{text}</p>
      {action}
    </div>
  )
}

export function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="Sin coincidencias"
      text="Prueba otra búsqueda o cambia el filtro."
      action={
        <button type="button" className="button button-secondary" onClick={onClear}>
          <X aria-hidden className="size-4 shrink-0" />
          Limpiar filtros
        </button>
      }
    />
  )
}
