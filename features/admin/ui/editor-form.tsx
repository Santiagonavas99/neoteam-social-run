import { Check, Trash2 } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
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
    <form className="record-editor" onSubmit={onSubmit}>
      <div className="editor-heading">
        <h3>{title}</h3>
        <span className="muted">{hint}</span>
      </div>
      <fieldset disabled={locked}>
        <legend className="sr-only">{legend}</legend>
        <div className="form-grid two">{children}</div>
      </fieldset>
      <Feedback value={feedback} />
      <div className="editor-actions">
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
            className="text-link danger-text"
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
