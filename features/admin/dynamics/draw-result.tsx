import { Trophy, X } from 'lucide-react'
import type { ScannedParticipant } from '../types'
import { useReveal } from '../ui/use-reveal'

export function DrawResult({
  name,
  winners,
  onClose,
}: {
  name: string
  winners: ScannedParticipant[]
  onClose: () => void
}) {
  const ref = useReveal<HTMLElement>()
  return (
    <section
      ref={ref}
      aria-labelledby="draw-result-title"
      className="mb-4 scroll-mt-4 rounded-card border border-neo-border bg-neo-success-bg p-4 md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="draw-result-title"
          className="m-0 flex items-center gap-2 text-base font-bold text-neo-accent-dark"
        >
          <Trophy aria-hidden className="size-5 shrink-0" />
          Ganadores · {name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar resultado"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-neo-text hover:bg-neo-white"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <ol className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
        {winners.map((winner, index) => (
          <li key={winner.id} className="flex items-baseline gap-3">
            <span aria-hidden className="w-6 shrink-0 text-sm font-bold text-neo-accent-dark">
              {index + 1}.
            </span>
            <div className="min-w-0">
              <p className="m-0 text-lg font-bold break-words text-neo-text">
                {winner.firstName} {winner.lastName}
              </p>
              <p className="m-0 text-sm text-neo-text-secondary">
                {winner.code} · {winner.group}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
