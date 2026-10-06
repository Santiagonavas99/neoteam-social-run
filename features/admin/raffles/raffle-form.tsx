'use client'

import { raffleStates } from '../labels'
import { type CommunityRecord, isNew, type Raffle } from '../types'
import { EditorForm, useEditor } from '../ui/editor-form'
import { LabelOptions } from '../ui/label-options'

export function RaffleForm({
  row,
  brands,
  onSave,
  onCancel,
  onDelete,
}: {
  row: Raffle
  brands: CommunityRecord[]
  onSave: (row: Raffle) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
}) {
  const { values, update, busy, feedback, submit } = useEditor(row, onSave)

  return (
    <EditorForm
      title={isNew(row) ? 'Nueva rifa' : `Editar ${row.name}`}
      hint="Los cambios se publican al guardar."
      legend="Datos del registro"
      submitLabel="Guardar cambios"
      busy={busy}
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
      <label>
        Premio
        <input
          value={values.prize ?? ''}
          required
          onChange={(e) => update('prize', e.target.value)}
        />
      </label>
      <label className="span-full">
        Descripción
        <textarea
          rows={2}
          value={values.description ?? ''}
          onChange={(e) => update('description', e.target.value)}
        />
      </label>
      <label>
        Número de ganadores
        <input
          type="number"
          min={1}
          step={1}
          required
          value={values.winner_count ?? 1}
          onChange={(e) => update('winner_count', Number(e.target.value))}
        />
      </label>
      <label>
        Estado
        <select value={values.status ?? 'draft'} onChange={(e) => update('status', e.target.value)}>
          <LabelOptions labels={raffleStates} />
        </select>
      </label>
      <label className="span-full">
        Marca patrocinadora
        <select
          value={values.sponsor_brand_id ?? ''}
          onChange={(e) => update('sponsor_brand_id', e.target.value || null)}
        >
          <option value="">Sin patrocinador</option>
          {brands
            .filter((brand) => brand.active || brand.id === values.sponsor_brand_id)
            .map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
        </select>
      </label>
      <label className="check-label span-full">
        <input
          type="checkbox"
          checked={Boolean(values.requires_checkin)}
          onChange={(e) => update('requires_checkin', e.target.checked)}
        />
        Requiere check-in para participar
      </label>
    </EditorForm>
  )
}
