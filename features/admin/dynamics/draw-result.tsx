import { ChevronRight, Trophy, UserX, X } from 'lucide-react'
import { useState } from 'react'
import type { ScannedParticipant } from '../types'
import { useReveal } from '../ui/use-reveal'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function DrawResult({
  name,
  winners,
  reveal,
  busy,
  onAbsent,
  onClose,
}: {
  name: string
  winners: ScannedParticipant[]
  reveal: boolean
  busy: boolean
  onAbsent: (winner: ScannedParticipant, place: number) => void
  onClose: () => void
}) {
  const ref = useReveal<HTMLElement>()
  const [shown, setShown] = useState(() =>
    reveal && !prefersReducedMotion() ? Math.min(1, winners.length) : winners.length,
  )
  return (
    <section
      ref={ref}
      aria-labelledby="draw-result-title"
      className="mb-4 scroll-mt-4 rounded-card border border-neo-border bg-neo-success-bg p-4 md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="draw-result-title"
          className="m-0 flex items-center gap-2 text-base font-bold text-neo-accent-text"
        >
          <Trophy aria-hidden className="size-5 shrink-0" />
          Ganadores · {name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar resultado"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-neo-text hover:bg-neo-surface"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      {winners.length ? (
        <ol aria-live="polite" className="m-0 mt-3 flex list-none flex-col gap-4 p-0">
          {winners.slice(0, shown).map((winner, index) => (
            <li
              key={winner.id}
              className="flex flex-col gap-2 motion-safe:animate-[reveal_400ms_ease-out] md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-baseline gap-3">
                <span aria-hidden className="w-6 shrink-0 text-sm font-bold text-neo-accent-text">
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
              </div>
              <button
                type="button"
                className="button button-small button-secondary self-start md:self-auto"
                onClick={() => onAbsent(winner, index + 1)}
                disabled={busy}
              >
                <UserX aria-hidden className="size-4 shrink-0" />
                No está · sortear otro
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="m-0 mt-3 text-sm text-neo-text-secondary">Este sorteo no tiene ganadores.</p>
      )}
      {shown < winners.length && (
        <button
          type="button"
          className="button mt-4 w-full md:w-auto"
          onClick={() => setShown((count) => count + 1)}
        >
          Siguiente ganador ({shown + 1} de {winners.length})
          <ChevronRight aria-hidden className="size-4 shrink-0" />
        </button>
      )}
    </section>
  )
}
