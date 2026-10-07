'use client'

import { dynamicFormTypes, dynamicStates, dynamicTypes } from '../labels'
import { type CommunityRecord, type DynamicRow, type DynamicType, isNew } from '../types'
import { EditorForm, useEditor } from '../ui/editor-form'
import { LabelOptions } from '../ui/label-options'
import { percentToProbability, probabilityToPercent } from './probability'

export function DynamicForm({
  row,
  brands,
  dynamics,
  onSave,
  onCancel,
  onDelete,
}: {
  row: DynamicRow
  brands: CommunityRecord[]
  dynamics: DynamicRow[]
  onSave: (row: DynamicRow) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
}) {
  const { values, update, busy, feedback, submit } = useEditor(row, onSave)
  const types = dynamicFormTypes.includes(row.type)
    ? dynamicFormTypes
    : [...dynamicFormTypes, row.type]
  const raffle = values.type === 'raffle'
  const instantWin = values.type === 'instant_win'

  return (
    <EditorForm
      title={isNew(row) ? 'Nueva dinámica' : `Editar ${row.name}`}
      hint="Configura cómo participa la gente y qué gana."
      legend="Datos de la dinámica"
      submitLabel="Guardar dinámica"
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
          value={values.name}
          required
          maxLength={120}
          onChange={(e) => update('name', e.target.value)}
        />
      </label>
      <label>
        Tipo
        <select value={values.type} onChange={(e) => update('type', e.target.value as DynamicType)}>
          {types.map((type) => (
            <option key={type} value={type}>
              {dynamicTypes[type]}
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-full">
        Descripción
        <textarea
          rows={2}
          value={values.description ?? ''}
          placeholder="Qué debe hacer el corredor."
          onChange={(e) => update('description', e.target.value)}
        />
      </label>
      <label>
        Estado
        <select
          value={values.status}
          onChange={(e) => update('status', e.target.value as DynamicRow['status'])}
        >
          <LabelOptions labels={dynamicStates} />
        </select>
        <small>Borrador no recibe participaciones; actívala para escanear o sortear.</small>
      </label>
      {!raffle && (
        <label>
          Puntos
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={values.points}
            onChange={(e) => update('points', Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
      )}
      {(raffle || instantWin) && (
        <>
          <label>
            Premio
            <input
              value={values.prize ?? ''}
              required
              maxLength={240}
              onChange={(e) => update('prize', e.target.value)}
            />
          </label>
          <label>
            {instantWin ? 'Máximo de ganadores' : 'Número de ganadores'}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              value={values.winner_count}
              onChange={(e) => update('winner_count', Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        </>
      )}
      {instantWin && (
        <label>
          Probabilidad de ganar (%)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            value={probabilityToPercent(Number(values.config?.win_probability ?? 0.1))}
            onChange={(e) =>
              update('config', {
                ...values.config,
                win_probability: percentToProbability(Number(e.target.value)),
              })
            }
          />
        </label>
      )}
      {raffle && (
        <label className="col-span-full">
          Participan quienes completaron
          <select
            value={values.eligibility_dynamic_id ?? ''}
            onChange={(e) => update('eligibility_dynamic_id', e.target.value || null)}
          >
            <option value="">Todos los inscritos elegibles</option>
            {dynamics
              .filter((item) => item.id !== values.id && item.type !== 'raffle')
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {dynamicTypes[item.type]}
                </option>
              ))}
          </select>
        </label>
      )}
      <label className="col-span-full">
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
      <label className="check-label col-span-full">
        <input
          type="checkbox"
          checked={values.requires_checkin}
          onChange={(e) => update('requires_checkin', e.target.checked)}
        />
        Requiere check-in para participar
      </label>
    </EditorForm>
  )
}
