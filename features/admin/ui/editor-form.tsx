import { Check, Trash2 } from 'lucide-react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Feedback } from './admin-ui'

export function EditorForm({
  title,
  hint,
  legend,
  submitLabel,
  busy,
  uploading = false,
  feedback,
  onSubmit,
  onCancel,
  onDelete,
  children,
}: {
  title: string
  hint: string
  legend: string
  submitLabel: string
  busy: boolean
  uploading?: boolean
  feedback: FeedbackValue
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onDelete?: () => void
  children: ReactNode
}) {
  const locked = busy || uploading
  return (
    <form
      className="mb-5 rounded-card border border-neo-border bg-neo-surface p-5 md:p-7 [article>&]:m-0 [article>&]:rounded-t-none [article>&]:border-x-0 [article>&]:border-b-0 [article>&]:bg-neo-bg"
      onSubmit={onSubmit}
    >
      <div className="mb-6">
        <h3 className="m-0 mb-2 text-lg font-bold tracking-[-0.03em]">{title}</h3>
        <span className="text-xs text-neo-text-secondary">{hint}</span>
      </div>
      <fieldset disabled={locked}>
        <legend className="sr-only">{legend}</legend>
        <div className="grid max-w-[760px] grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
      </fieldset>
      <Feedback value={feedback} />
      <div className="mt-6 flex flex-wrap items-center gap-2 md:gap-3 [&>.button]:flex-1 md:[&>.button]:flex-none">
        <button type="submit" className="button" disabled={locked}>
          <Check aria-hidden className="size-4 shrink-0" />
          {busy ? 'Guardando…' : uploading ? 'Subiendo imagen…' : submitLabel}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
          disabled={locked}
        >
          Cancelar
        </button>
        {onDelete && (
          <button
            type="button"
            className="text-link danger-text basis-full md:ml-auto md:basis-auto"
            onClick={onDelete}
            disabled={locked}
          >
            <Trash2 aria-hidden className="size-4 shrink-0" />
            Eliminar
          </button>
        )}
      </div>
    </form>
  )
}

export function useEditor<Row>(
  row: Row,
  onSave: (values: Row) => Promise<void>,
  validate?: (values: Row) => string | null,
) {
  const [values, setValues] = useState({ ...row })
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)

  function update<K extends keyof Row>(key: K, value: Row[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const invalid = validate?.(values)
    if (invalid) {
      setFeedback({ kind: 'error', text: invalid })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      await onSave(values)
    } catch (error) {
      setFeedback({ kind: 'error', text: errorMessage(error, 'No pudimos guardar los cambios.') })
    } finally {
      setBusy(false)
    }
  }

  return { values, update, busy, feedback, setFeedback, submit }
}
