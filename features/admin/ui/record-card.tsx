import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'

export function RecordCard({
  logo,
  title,
  subtitle,
  meta,
  actions,
  children,
}: {
  logo?: ReactNode
  title: string
  subtitle: ReactNode
  meta: ReactNode
  actions: ReactNode
  children?: ReactNode
}) {
  return (
    <article className="record">
      <div className="record-summary">
        {logo}
        <div className="record-title">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="record-meta">{meta}</div>
        <div className="record-actions">{actions}</div>
      </div>
      {children}
    </article>
  )
}

export function EditButton({
  open,
  disabled,
  onClick,
}: {
  open: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="button button-secondary"
      aria-expanded={open}
      onClick={onClick}
      disabled={disabled}
    >
      <Pencil aria-hidden className="size-4 shrink-0" />
      Editar
    </button>
  )
}
