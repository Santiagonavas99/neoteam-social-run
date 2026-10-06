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
    <div className="empty-state">
      <span className="empty-number" aria-hidden="true">
        <Icon aria-hidden className="mx-auto block size-8" />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
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
