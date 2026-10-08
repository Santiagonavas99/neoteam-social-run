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
  const { values, update, busy, feedback, setFeedback, submit } = useEditor(row, onSave, (logo) =>
    logo.logo_url ? null : 'Sube una imagen antes de guardar el logo.',
  )
  const { uploading, upload } = useImageUpload({
    successText: 'Imagen subida. Guarda el logo para publicarlo.',
    onUploaded: (url) => update('logo_url', url),
    setFeedback,
  })

  return (
    <EditorForm
      title={isNew(row) ? 'Nuevo logo' : `Editar ${row.name}`}
      hint="Recomendado: logo horizontal con fondo transparente. Se guardará como WEBP."
      legend="Datos del logo"
      submitLabel="Guardar logo"
      busy={busy || listBusy}
      uploading={uploading}
      feedback={feedback}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <label>
        Nombre
        <input
          autoFocus
          required
          maxLength={120}
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
        />
      </label>
      <label>
        Orden
        <input
          type="number"
          step={1}
          value={values.sort_order}
          onChange={(event) => update('sort_order', Number(event.target.value))}
        />
        <small>Los números menores aparecen primero.</small>
      </label>
      <label className="col-span-full">
        Enlace opcional
        <input
          type="url"
          placeholder="https://"
          value={values.link_url ?? ''}
          onChange={(event) => update('link_url', event.target.value)}
        />
        <small>Si lo dejas vacío, el logo no será clicable.</small>
      </label>
      <ImageUploadField
        url={values.logo_url}
        name={values.name}
        uploading={uploading}
        noun="imagen"
        hint="JPG, PNG, HEIC, AVIF y más según navegador · WEBP automático · origen hasta 40 MB"
        onChange={upload}
      />
      <label className="check-label">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(event) => update('active', event.target.checked)}
        />
        Mostrar en el carrusel
      </label>
      <fieldset className="col-span-full grid gap-3 rounded-xl border border-neo-border p-4">
        <legend className="px-1 text-sm font-semibold">Reutilizar en otras cintas</legend>
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
        <small>Usa este mismo logo y enlace; no crea otro registro.</small>
      </fieldset>
    </EditorForm>
  )
}
