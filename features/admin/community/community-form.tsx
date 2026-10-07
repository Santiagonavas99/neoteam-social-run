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
  const { values, update, busy, feedback, setFeedback, submit } = useEditor(row, onSave)
  const { uploading, upload } = useImageUpload({
    successText: 'Imagen subida. Guarda los cambios para publicarla.',
    onUploaded: (url) => update('logo_url', url),
    setFeedback,
  })
  const brand = resource === 'brands'

  return (
    <EditorForm
      title={isNew(row) ? (brand ? 'Nueva marca' : 'Nuevo grupo') : `Editar ${row.name}`}
      hint="Los cambios se publican al guardar."
      legend="Datos del registro"
      submitLabel="Guardar cambios"
      busy={busy}
      uploading={uploading}
      feedback={feedback}
      onSubmit={submit}
      onCancel={onCancel}
      onDelete={onDelete}
    >
      <label>
        Nombre
        <input
          autoFocus
          value={values.name ?? ''}
          required
          maxLength={120}
          onChange={(e) => update('name', e.target.value)}
        />
      </label>
      {brand && (
        <label>
          Tipo
          <select value={values.type ?? 'invited'} onChange={(e) => update('type', e.target.value)}>
            <LabelOptions labels={brandTypes} />
          </select>
          <small>
            Organizador → Organización. Patrocinador → Marcas. Aliado principal e Invitado →
            Partners / Marcas invitadas.
          </small>
        </label>
      )}
      <label>
        Instagram
        <input
          placeholder="@usuario"
          value={values.instagram ?? ''}
          onChange={(e) => update('instagram', e.target.value)}
        />
      </label>
      <label>
        Orden
        <input
          type="number"
          step={1}
          required
          value={values.sort_order ?? 0}
          onChange={(e) => update('sort_order', Number(e.target.value))}
        />
        <small>Los números menores aparecen primero en la página.</small>
      </label>
      {brand && (
        <label>
          Sitio web
          <input
            placeholder="https://"
            value={values.website ?? ''}
            onChange={(e) => update('website', e.target.value)}
          />
        </label>
      )}
      <ImageUploadField
        url={values.logo_url}
        name={values.name}
        uploading={uploading}
        noun="logo"
        hint="PNG, JPG o WEBP · máximo 4 MB"
        onChange={upload}
      />
      <label className="check-label">
        <input
          type="checkbox"
          checked={Boolean(values.show_on_home)}
          onChange={(e) => update('show_on_home', e.target.checked)}
        />
        Mostrar en página
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={Boolean(values.active)}
          onChange={(e) => update('active', e.target.checked)}
        />
        Activo
      </label>
    </EditorForm>
  )
}
