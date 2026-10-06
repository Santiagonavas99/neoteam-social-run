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
    <section ref={ref} className="confirmation-panel scroll-mt-4" aria-label="Confirmar acción">
      <h2 className="flex items-center gap-2">
        {draw ? (
          <Dices aria-hidden className="size-5 shrink-0" />
        ) : (
          <TriangleAlert aria-hidden className="size-5 shrink-0 text-neo-danger" />
        )}
        {title}
      </h2>
      <p>{text}</p>
      <div className="toolbar-actions">
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
