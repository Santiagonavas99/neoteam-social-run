import { Dices, Trash2, TriangleAlert } from 'lucide-react'
import { useReveal } from './use-reveal'

export function ConfirmPanel({
  kind,
  title,
  text,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  kind: 'delete' | 'draw'
  title: string
  text: string
  confirmLabel: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const draw = kind === 'draw'
  const ref = useReveal<HTMLElement>()
  return (
    <section
      ref={ref}
      className="my-4 scroll-mt-4 rounded-control border border-l-4 border-neo-accent border-l-neo-accent-dark bg-neo-accent-soft p-5 md:my-6 md:p-6"
      aria-label="Confirmar acción"
    >
      <h2 className="m-0 mb-3 flex items-center gap-2 text-xl font-bold tracking-[-0.03em]">
        {draw ? (
          <Dices aria-hidden className="size-5 shrink-0" />
        ) : (
          <TriangleAlert aria-hidden className="size-5 shrink-0 text-neo-danger" />
        )}
        {title}
      </h2>
      <p className="m-0 mb-4 max-w-[650px] text-sm text-neo-accent-text">{text}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="button button-secondary"
          autoFocus
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={draw ? 'button' : 'button button-danger'}
          onClick={onConfirm}
          disabled={busy}
        >
          {draw ? (
            <Dices aria-hidden className="size-4 shrink-0" />
          ) : (
            <Trash2 aria-hidden className="size-4 shrink-0" />
          )}
          {busy ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </section>
  )
}
