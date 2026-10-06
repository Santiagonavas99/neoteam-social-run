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
    <article className="min-w-0 rounded-card border border-neo-border bg-neo-surface">
      <div className="flex flex-wrap items-center gap-4 p-5 md:flex-nowrap md:gap-5 md:p-6">
        {logo}
        <div className="min-w-0 flex-1">
          <h2 className="m-0 mb-1.5 text-lg font-bold tracking-[-0.035em] [overflow-wrap:anywhere]">
            {title}
          </h2>
          <p className="m-0 text-[13px] text-neo-text-secondary">{subtitle}</p>
        </div>
        <div className="flex min-w-0 basis-full flex-col gap-1.5 md:max-w-60 md:basis-auto [&_small]:text-xs [&_small]:text-neo-text-secondary [&_small]:[overflow-wrap:anywhere]">
          {meta}
        </div>
        <div className="flex basis-full gap-2 md:shrink-0 md:basis-auto [&>*]:flex-1 md:[&>*]:flex-none">
          {actions}
        </div>
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
