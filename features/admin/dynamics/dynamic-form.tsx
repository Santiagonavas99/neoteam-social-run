'use client'

import { dynamicFormTypes, dynamicStates, dynamicTypes, raffleGenders } from '../labels'
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
  const challenge = values.type === 'challenge'

  return (
    <EditorForm
      title={isNew(row) ? 'Nueva dinámica' : `Editar ${row.name}`}
      hint={challenge
        ? 'Explica qué debe completar el corredor. El personal verifica y registra el resultado con QR.'
        : 'Configura cómo participa la gente y qué gana.'}
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
        {challenge ? '¿Qué debe hacer el corredor para completar el reto? *' : 'Descripción'}
        <textarea
          rows={challenge ? 4 : 2}
          required={challenge}
          minLength={challenge ? 10 : undefined}
          maxLength={1000}
          value={values.description ?? ''}
          placeholder={challenge
            ? 'Ej. Realiza el recorrido. El personal verifica que terminó y escanea su pase.'
            : 'Qué debe hacer el corredor.'}
          onChange={(e) => update('description', e.target.value)}
        />
        {challenge && (
          <small>El reto se confirma con un escaneo por corredor. Esta versión no mide tiempos ni calcula el más rápido automáticamente.</small>
        )}
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
      {challenge && (
        <p className="col-span-full m-0 rounded-control border border-neo-accent-border bg-neo-accent-soft p-4 text-sm text-neo-text-secondary">
          <strong className="text-neo-accent-text">Cómo funcionará:</strong> al completar el reto,
          el personal entra en «En vivo» y escanea el QR del corredor. Cada persona puede
          registrar la finalización una sola vez.
        </p>
      )}
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
        <>
          <label>
            Categoría
            <select
              value={typeof values.config?.gender === 'string' ? values.config.gender : ''}
              onChange={(e) => update('config', { ...values.config, gender: e.target.value })}
            >
              <LabelOptions labels={raffleGenders} />
            </select>
          </label>
          <label className="check-label col-span-full">
            <input
              type="checkbox"
              checked={values.config?.exclude_winners === true}
              onChange={(e) =>
                update('config', { ...values.config, exclude_winners: e.target.checked })
              }
            />
            No repetir ganadores: deja fuera a quien ya ganó otro sorteo o premio
          </label>
        </>
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
