'use client'

import { isNew, type LogoItem } from '../types'
import { EditorForm, useEditor } from '../ui/editor-form'
import { ImageUploadField, useImageUpload } from '../ui/image-upload-field'

export function LogoForm({
  row,
  busy: listBusy,
  onSave,
  onCancel,
}: {
  row: LogoItem
  busy: boolean
  onSave: (row: LogoItem) => Promise<void>
  onCancel: () => void
}) {
  const newRecord = isNew(row)
  const { values, update, busy, feedback, setFeedback, submit } = useEditor(row, onSave, (logo) => {
    if (!logo.name.trim()) return 'Escribe el nombre del club o marca antes de guardar.'
    return logo.logo_url ? null : 'Sube una imagen antes de guardar el logo.'
  })
  const { uploading, upload, uploadFeedback } = useImageUpload({
    successText: 'Imagen subida. Guarda el logo para publicarlo.',
    onUploaded: (url) => update('logo_url', url),
    setFeedback,
  })

  return (
    <EditorForm
      title={newRecord ? 'Nuevo logo' : `Editar ${row.name}`}
      hint="Nombre → Logo → Dónde mostrarlo. Al terminar, guarda los cambios."
      legend="Datos del logo"
      submitLabel={newRecord ? 'Guardar y publicar' : 'Guardar logo'}
      busy={busy || listBusy}
      uploading={uploading}
      feedback={feedback}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <div className="col-span-full flex items-start gap-3 border-b border-neo-border pb-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-neo-accent-soft font-bold text-neo-accent-text">
          01
        </span>
        <div>
          <h4 className="mb-1 text-base font-bold">¿De quién es este logo?</h4>
          <p className="mb-0 text-sm text-neo-text-secondary">Escribe el nombre del club, marca u organización.</p>
        </div>
      </div>
      <label className="col-span-full">
        Nombre del club, marca u organización *
        <input
          required
          maxLength={120}
          autoComplete="organization"
          placeholder="Ej. Neo Team Running Club"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
        />
      </label>

      <div className="col-span-full mt-1 flex items-start gap-3 border-b border-neo-border pb-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-neo-accent-soft font-bold text-neo-accent-text">
          02
        </span>
        <div>
          <h4 className="mb-1 text-base font-bold">Añade el logo</h4>
          <p className="mb-0 text-sm text-neo-text-secondary">
            Recomendado: imagen horizontal con fondo transparente.
          </p>
        </div>
      </div>
      <ImageUploadField
        url={values.logo_url}
        name={values.name}
        uploading={uploading}
        noun="logo"
        hint="PNG, JPG, HEIC y más según navegador · WEBP automático o PNG/JPG alternativo · origen hasta 40 MB"
        uploadFeedback={uploadFeedback}
        onChange={upload}
      />

      <div className="col-span-full mt-1 flex items-start gap-3 border-b border-neo-border pb-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-neo-accent-soft font-bold text-neo-accent-text">
          03
        </span>
        <div>
          <h4 className="mb-1 text-base font-bold">Dónde mostrarlo</h4>
          <p className="mb-0 text-sm text-neo-text-secondary">Puedes utilizar el mismo logo en varias cintas.</p>
        </div>
      </div>
      <div className="col-span-full grid gap-4 rounded-xl border border-neo-border bg-neo-bg p-4">
        <label className="check-label">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(event) => update('active', event.target.checked)}
          />
          Mostrar en el carrusel principal
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={values.show_in_running_crews}
            onChange={(event) => update('show_in_running_crews', event.target.checked)}
          />
          También en Running crews
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={values.show_in_organizations}
            onChange={(event) => update('show_in_organizations', event.target.checked)}
          />
          También en Organizaciones
        </label>
        <small className="font-normal text-neo-text-secondary">
          Se reutiliza la misma imagen; no crea registros adicionales.
        </small>
      </div>

      <details className="group col-span-full rounded-xl border border-neo-border p-4" open={!newRecord || undefined}>
        <summary className="min-h-10 cursor-pointer font-semibold">
          Opciones adicionales <span className="font-normal text-neo-text-secondary">(opcional)</span>
        </summary>
        <div className="mt-4 grid gap-4">
          <label>
            Enlace opcional
            <input
              type="url"
              placeholder="https://"
              value={values.link_url ?? ''}
              onChange={(event) => update('link_url', event.target.value)}
            />
            <small>Si lo dejas vacío, el logo no será clicable.</small>
          </label>
          <label>
            Orden de aparición
            <input
              type="number"
              step={1}
              value={values.sort_order}
              onChange={(event) => update('sort_order', Number(event.target.value))}
            />
            <small>Los números menores aparecen primero.</small>
          </label>
        </div>
      </details>
      <p className="col-span-full mb-0 text-center text-xs text-neo-text-secondary">
        Al terminar, pulsa <strong>Guardar</strong> para publicar el logo.
      </p>
    </EditorForm>
  )
}
