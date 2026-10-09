'use client'

import { brandTypes } from '../labels'
import { type CommunityRecord, isNew } from '../types'
import { EditorForm, useEditor } from '../ui/editor-form'
import { ImageUploadField, useImageUpload } from '../ui/image-upload-field'
import { LabelOptions } from '../ui/label-options'

export function CommunityForm({
  row,
  resource,
  onSave,
  onCancel,
  onDelete,
}: {
  row: CommunityRecord
  resource: 'groups' | 'brands'
  onSave: (row: CommunityRecord) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
}) {
  const brand = resource === 'brands'
  const newRecord = isNew(row)
  const { values, update, busy, feedback, setFeedback, submit } = useEditor(
    row,
    onSave,
    (current) =>
      current.name.trim()
        ? null
        : brand
          ? 'Escribe el nombre de la marca u organización antes de guardar.'
          : 'Escribe el nombre del running crew antes de guardar.',
  )
  const { uploading, upload, uploadFeedback } = useImageUpload({
    successText: 'Logo cargado. Falta guardar el registro para publicarlo.',
    onUploaded: (url) => update('logo_url', url),
    setFeedback,
  })

  const subject = brand ? 'marca u organización' : 'running crew'

  return (
    <EditorForm
      title={
        newRecord
          ? brand
            ? 'Nueva marca u organización'
            : 'Nuevo running crew'
          : `Editar ${row.name}`
      }
      hint="Primero escribe el nombre, después añade el logo y finalmente guarda el registro."
      legend="Datos del registro"
      submitLabel={newRecord ? 'Guardar y publicar' : 'Guardar cambios'}
      busy={busy}
      uploading={uploading}
      feedback={feedback}
      onSubmit={submit}
      onCancel={onCancel}
      onDelete={onDelete}
    >
      <div className="col-span-full flex items-start gap-3 border-b border-neo-border pb-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-neo-accent-soft font-bold text-neo-accent-text">
          01
        </span>
        <div className="min-w-0">
          <h4 className="mb-1 text-base font-bold tracking-[-0.025em]">
            Nombre del {subject}
          </h4>
          <p className="mb-0 text-sm text-neo-text-secondary">
            Este nombre identificará el logo en el panel y en la web.
          </p>
        </div>
      </div>
      <label className="col-span-full">
        <span className="font-semibold">Nombre del {subject} <span aria-hidden="true">*</span></span>
        <input
          required
          maxLength={120}
          autoComplete="organization"
          placeholder={brand ? 'Ej. Marca aliada' : 'Ej. Neo Team Running Club'}
          value={values.name ?? ''}
          onChange={(event) => update('name', event.target.value)}
        />
        <small>Escribe aquí el nombre del club antes de subir su imagen.</small>
      </label>

      {brand && (
        <label className="col-span-full">
          Tipo de participación
          <select value={values.type ?? 'invited'} onChange={(event) => update('type', event.target.value)}>
            <LabelOptions labels={brandTypes} />
          </select>
          <small>El tipo determina en qué sección aparecerá la marca.</small>
        </label>
      )}

      <div className="col-span-full mt-1 flex items-start gap-3 border-b border-neo-border pb-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-neo-accent-soft font-bold text-neo-accent-text">
          02
        </span>
        <div className="min-w-0">
          <h4 className="mb-1 text-base font-bold tracking-[-0.025em]">
            Sube el logo
          </h4>
          <p className="mb-0 text-sm text-neo-text-secondary">
            Elige la imagen de <strong className="text-neo-text">{values.name.trim() || `tu ${subject}`}</strong>.
          </p>
        </div>
      </div>
      <ImageUploadField
        url={values.logo_url}
        name={values.name}
        uploading={uploading}
        noun="logo"
        hint="PNG, JPG, HEIC y otros formatos compatibles · WEBP automático o PNG/JPG alternativo · origen hasta 40 MB"
        uploadFeedback={uploadFeedback}
        onChange={upload}
      />

      <div className="col-span-full mt-1 flex items-start gap-3 border-b border-neo-border pb-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-neo-accent-soft font-bold text-neo-accent-text">
          03
        </span>
        <div className="min-w-0">
          <h4 className="mb-1 text-base font-bold tracking-[-0.025em]">Visibilidad</h4>
          <p className="mb-0 text-sm text-neo-text-secondary">Elige si aparecerá en la web del evento.</p>
        </div>
      </div>
      <div className="col-span-full grid gap-4 rounded-xl border border-neo-border bg-neo-bg p-4">
        <label className="check-label">
          <input
            type="checkbox"
            checked={Boolean(values.show_on_home)}
            onChange={(event) => update('show_on_home', event.target.checked)}
          />
          Mostrar en página
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={Boolean(values.active)}
            onChange={(event) => update('active', event.target.checked)}
          />
          Activo
        </label>
        <small className="font-normal leading-relaxed text-neo-text-secondary">
          {!brand
            ? 'Los running crews activos y visibles aparecen en la cinta de la página principal.'
            : values.type === 'organizer'
              ? 'Las organizaciones activas y visibles aparecen en su cinta.'
              : 'Las marcas activas y visibles aparecen en sus secciones.'}
        </small>
      </div>

      <details className="group col-span-full rounded-xl border border-neo-border p-4" open={!newRecord || undefined}>
        <summary className="min-h-10 cursor-pointer font-semibold text-neo-text">
          Opciones adicionales <span className="font-normal text-neo-text-secondary">(opcional)</span>
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            Instagram
            <input
              placeholder="@usuario"
              value={values.instagram ?? ''}
              onChange={(event) => update('instagram', event.target.value)}
            />
          </label>
          <label>
            Orden de aparición
            <input
              type="number"
              step={1}
              required
              value={values.sort_order ?? 0}
              onChange={(event) => update('sort_order', Number(event.target.value))}
            />
            <small>Los números menores aparecen primero.</small>
          </label>
          {brand && (
            <label className="md:col-span-2">
              Sitio web
              <input
                type="url"
                placeholder="https://"
                value={values.website ?? ''}
                onChange={(event) => update('website', event.target.value)}
              />
            </label>
          )}
        </div>
      </details>
      <p className="col-span-full mb-0 text-center text-xs leading-relaxed text-neo-text-secondary">
        Cuando tengas el nombre y el logo listos, pulsa <strong>Guardar</strong> para finalizar.
      </p>
    </EditorForm>
  )
}
