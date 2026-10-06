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
