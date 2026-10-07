import { ListOrdered } from 'lucide-react'
import type { RankedRunner } from '../types'

export function Ranking({ runners }: { runners: RankedRunner[] }) {
  if (!runners.length) return null
  return (
    <section
      aria-labelledby="ranking-title"
      className="mb-4 rounded-card border border-neo-border bg-neo-surface p-4 md:p-6"
    >
      <h2
        id="ranking-title"
        className="m-0 flex items-center gap-2 text-base font-bold text-neo-text"
      >
        <ListOrdered aria-hidden className="size-5 shrink-0" />
        Ranking de puntos
      </h2>
      <ol className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {runners.map((runner, index) => (
          <li key={runner.id} className="flex items-baseline gap-3">
            <span aria-hidden className="w-6 shrink-0 text-sm font-bold text-neo-accent-text">
              {index + 1}.
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 font-bold break-words text-neo-text">
                {runner.firstName} {runner.lastName}
              </p>
              <p className="m-0 text-xs text-neo-text-secondary">
                {runner.code} · {runner.group}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold tabular-nums text-neo-text">
              {runner.points} pts
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
