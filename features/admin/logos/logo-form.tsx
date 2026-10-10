'use client'

import { useState } from 'react'
import { isNew, type LogoItem } from '../types'
import { EditorForm, useEditor } from '../ui/editor-form'
import { FormStep } from '../ui/form-step'
import { ImageUploadField, useImageUpload } from '../ui/image-upload-field'
import { nameFromLogoFilename } from './logo-name'

export function LogoForm({
  row,
  busy: listBusy,
  onSave,
  onCancel,
  kind = 'brand',
}: {
  row: LogoItem
  busy: boolean
  onSave: (row: LogoItem, addAnother?: boolean) => Promise<void>
  onCancel: () => void
  kind?: 'brand' | 'race'
}) {
  const newRecord = isNew(row)
  const [addAnother, setAddAnother] = useState(false)
  const { values, update, busy, feedback, setFeedback, submit } = useEditor(
    row,
    (next) => onSave(next, newRecord && addAnother),
    (logo) => {
      if (!logo.name.trim()) {
        return kind === 'race'
          ? 'Escribe el nombre de la carrera.'
          : 'Escribe el nombre del club o marca antes de guardar.'
      }
      return logo.logo_url ? null : 'Sube una imagen antes de guardar el logo.'
    },
  )
  const { uploading, upload, uploadFeedback } = useImageUpload({
    successText: 'Imagen subida. Guarda el logo para publicarlo.',
    onUploaded: (url) => update('logo_url', url),
    onFileSelected: (file) => {
      if (!newRecord || values.name.trim()) return
      const suggestion = nameFromLogoFilename(file.name)
      if (suggestion) update('name', suggestion)
    },
    setFeedback,
  })

  return (
    <EditorForm
      title={newRecord ? (kind === 'race' ? 'Nueva carrera' : 'Nuevo logo') : `Editar ${row.name}`}
      hint="Nombre → Logo → Dónde mostrarlo. Al terminar, guarda los cambios."
      legend="Datos del logo"
      submitLabel={newRecord ? 'Guardar y publicar' : 'Guardar logo'}
      busy={busy || listBusy}
      uploading={uploading}
      feedback={feedback}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <FormStep
        number="01"
        title="¿De quién es este logo?"
        description={
          kind === 'race'
            ? 'Escribe el nombre oficial de la carrera.'
            : 'Escribe el nombre del club, marca u organización.'
        }
      />
      <label className="col-span-full">
        {kind === 'race' ? 'Nombre de la carrera *' : 'Nombre del club, marca u organización *'}
        <input
          required
          maxLength={120}
          autoComplete="organization"
          placeholder={kind === 'race' ? 'Ej. Media Maratón de Cali' : 'Ej. Neo Team Running Club'}
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
        />
      </label>

      <FormStep
        number="02"
        title="Añade el logo"
        description="Recomendado: imagen horizontal con fondo transparente."
      />
      <ImageUploadField
        url={values.logo_url}
        name={values.name}
        uploading={uploading}
        noun="logo"
        hint="PNG, JPG, HEIC y más según navegador · WEBP automático o PNG/JPG alternativo · origen hasta 40 MB"
        uploadFeedback={uploadFeedback}
        onChange={upload}
      />

      <FormStep
        number="03"
        title="Dónde mostrarlo"
        description={
          kind === 'race'
            ? 'Controla si esta carrera aparece en su carrusel.'
            : 'Puedes utilizar el mismo logo en varias cintas.'
        }
      />
      <div className="col-span-full grid gap-4 rounded-xl border border-neo-border bg-neo-bg p-4">
        <label className="check-label">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(event) => update('active', event.target.checked)}
          />
          {kind === 'race' ? 'Mostrar en Carreras aliadas' : 'Mostrar en Marcas aliadas'}
        </label>
        {kind === 'brand' && (
          <>
            <label className="check-label">
              <input
                type="checkbox"
                checked={values.show_in_races}
                onChange={(event) => update('show_in_races', event.target.checked)}
              />
              También en Carreras aliadas
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
          </>
        )}
      </div>

      <details
        className="group col-span-full rounded-xl border border-neo-border p-4"
        open={!newRecord || undefined}
      >
        <summary className="min-h-10 cursor-pointer font-semibold">
          Opciones adicionales{' '}
          <span className="font-normal text-neo-text-secondary">(opcional)</span>
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
      {newRecord && (
        <label className="check-label col-span-full">
          <input
            type="checkbox"
            checked={addAnother}
            onChange={(event) => setAddAnother(event.target.checked)}
          />
          Guardar y seguir añadiendo logos
        </label>
      )}
      <p className="col-span-full mb-0 text-center text-xs text-neo-text-secondary">
        Si el archivo tiene un nombre reconocible, lo sugerimos automáticamente y puedes editarlo.
      </p>
    </EditorForm>
  )
}
