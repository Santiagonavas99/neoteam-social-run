'use client'

import { dynamicFormTypes, dynamicStates, dynamicTypes, raffleGenders } from '../labels'
import {
  type CommunityRecord,
  type DynamicRow,
  type DynamicType,
  isNew,
  type LogoItem,
} from '../types'
import { EditorForm, useEditor } from '../ui/editor-form'
import { LabelOptions } from '../ui/label-options'
import { dynamicSponsorOptions, dynamicSponsorValue, sponsorFields } from './dynamic-sponsors'
import { percentToProbability, probabilityToPercent } from './probability'

export function DynamicForm({
  row,
  brands,
  logos,
  dynamics,
  onSave,
  onCancel,
  onDelete,
  cloneMode = false,
}: {
  row: DynamicRow
  brands: CommunityRecord[]
  logos: LogoItem[]
  dynamics: DynamicRow[]
  cloneMode?: boolean
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
  const trivia = values.type === 'trivia'
  const wheel = raffle && ['wheel','ruleta_pendiente'].includes(String(values.config?.mechanic))
  const special = wheel || trivia || (challenge && ['timed_max','timed_min','team_relay'].includes(String(values.config?.challenge_mode)))
  const wheelPrizes = (Array.isArray(values.config?.wheel_prizes) ? values.config.wheel_prizes : []) as Array<{ id: string; label: string; quantity: number; weight: number }>
  const triviaOptions = (Array.isArray(values.config?.trivia_options) ? values.config.trivia_options : []) as string[]

  const selectedSponsor = dynamicSponsorValue(values)
  const sponsorOptions = dynamicSponsorOptions(brands, logos, selectedSponsor)

  return (
    <EditorForm
      title={cloneMode ? 'Repetir dinámica' : isNew(row) ? 'Nueva dinámica' : `Editar ${row.name}`}
      hint={
        challenge
          ? 'Explica qué debe completar el corredor. El personal verifica y registra el resultado con QR.'
          : 'Configura cómo participa la gente y qué gana.'
      }
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
          placeholder={
            challenge
              ? 'Ej. Realiza el recorrido. El personal verifica que terminó y escanea su pase.'
              : 'Qué debe hacer el corredor.'
          }
          onChange={(e) => update('description', e.target.value)}
        />
        {challenge && (
          <small>
            Si seleccionas resistencia o velocidad, el cronómetro oficial y la clasificación se gestionan desde «En vivo».
          </small>
        )}
      </label>
      {challenge && (
        <>
          <label>
            Modalidad del reto
            <select
              value={typeof values.config?.challenge_mode === 'string' ? values.config.challenge_mode : 'completion'}
              onChange={(e) => update('config', { ...values.config, challenge_mode: e.target.value })}
            >
              <option value="completion">Completar actividad (QR)</option>
              <option value="timed_max">Resistencia: gana el mayor tiempo</option>
              <option value="timed_min">Velocidad: gana el menor tiempo</option>
              <option value="team_relay">Relevos por equipos: menor tiempo</option>
            </select>
          </label>
          {values.config?.challenge_mode !== undefined && values.config?.challenge_mode !== 'completion' && (
            <p className="col-span-full m-0 rounded-control border border-neo-accent-border bg-neo-accent-soft p-4 text-sm text-neo-text-secondary" role="status">
              Esta modalidad queda documentada, pero el cronómetro, la clasificación por tiempo y la asignación automática de premios aún no están implementados. No actives el reto hasta completar esa integración.
            </p>
          )}
        </>
      )}
      {raffle && (
        <label>
          Mecánica del premio
          <select value={wheel ? 'wheel' : 'raffle'}
            onChange={(event) => update('config', { ...values.config, mechanic: event.target.value, pending_review: true })}>
            <option value="raffle">Rifa tradicional (ganadores aleatorios)</option>
            <option value="wheel">Ruleta con premios e inventario</option>
          </select>
        </label>
      )}
      {wheel && (
        <div className="col-span-full grid gap-3 rounded-control border border-neo-border p-4">
          <h3 className="m-0 font-bold">Inventario de la ruleta</h3>
          <p className="m-0 text-xs text-neo-text-secondary">Cada premio tiene su propio cupo. Al agotarse desaparece del sorteo; el ganador se decide en el servidor.</p>
          {wheelPrizes.map((prize, index) => (
            <div key={prize.id} className="grid grid-cols-2 gap-2 rounded-control bg-neo-muted-bg p-3">
              <label className="col-span-2">Nombre del premio
                <input value={prize.label} maxLength={100}
                  onChange={(e) => update('config', { ...values.config, wheel_prizes: wheelPrizes.map((x,i) => i === index ? { ...x,label:e.target.value } : x) })} />
              </label>
              <label>Cantidad
                <input type="number" min={1} max={500} value={prize.quantity}
                  onChange={(e) => update('config', { ...values.config, wheel_prizes: wheelPrizes.map((x,i) => i === index ? { ...x,quantity:Math.max(1,Math.floor(Number(e.target.value)||1)) } : x) })} />
              </label>
              <label>Peso en el mezclado
                <input type="number" min={1} max={1000} value={prize.weight}
                  onChange={(e) => update('config', { ...values.config, wheel_prizes: wheelPrizes.map((x,i) => i === index ? { ...x,weight:Math.max(1,Math.floor(Number(e.target.value)||1)) } : x) })} />
              </label>
              <button type="button" className="text-link col-span-2 self-start"
                onClick={() => update('config', { ...values.config, wheel_prizes:wheelPrizes.filter((_,i) => i!==index),pending_review:true })}>Quitar premio</button>
            </div>
          ))}
          <button type="button" className="button button-secondary" disabled={wheelPrizes.length >= 20}
            onClick={() => update('config', { ...values.config, pending_review:true,
              wheel_prizes:[...wheelPrizes,{ id:'slot-'+Math.random().toString(36).slice(2,10),label:'',quantity:1,weight:1 }],
            })}>Añadir tipo de premio</button>
          <label>Probabilidad de obtener un premio (%)
            <input type="number" min={0} max={100} step={1}
              value={Math.round(Number(values.config?.wheel_probability ?? 1)*100)}
              onChange={(e) => update('config', { ...values.config,
                wheel_probability: Math.min(1,Math.max(0,Number(e.target.value)/100)),pending_review:true })} />
          </label>
        </div>
      )}
      {trivia && (
        <div className="col-span-full grid gap-3 rounded-control border border-neo-border p-4">
          <h3 className="m-0 font-bold">Pregunta y respuesta verificada</h3>
          <label>Pregunta
            <textarea rows={2} maxLength={300} value={String(values.config?.trivia_question ?? '')}
              onChange={(e) => update('config', { ...values.config,trivia_question:e.target.value,pending_review:true })} />
          </label>
          {Array.from({ length: Math.max(2,triviaOptions.length) }, (_,index) => (
            <label key={String.fromCharCode(65 + index)}>Opción {String.fromCharCode(65+index)}
              <input value={triviaOptions[index] ?? ''} maxLength={150}
                onChange={(e) => update('config', { ...values.config,pending_review:true,
                  trivia_options:Array.from({length:Math.max(2,triviaOptions.length)},(_,i) => i === index ? e.target.value : triviaOptions[i] ?? ''),
                })} />
            </label>
          ))}
          {triviaOptions.length < 8 && (
            <button type="button" className="button button-secondary"
              onClick={() => update('config', { ...values.config,trivia_options:[...triviaOptions,''],pending_review:true })}>
              Añadir opción
            </button>
          )}
          <label>Respuesta correcta (confirmada por organización)
            <select value={typeof values.config?.trivia_correct_index==='number' ? values.config.trivia_correct_index : ''}
              onChange={(e) => update('config', { ...values.config,trivia_correct_index:Number(e.target.value),pending_review:true })}>
              <option value="">Seleccionar respuesta</option>
              {triviaOptions.map((option,index) => (
                <option key={String.fromCharCode(65 + index)} value={index}>{String.fromCharCode(65+index)}. {option}</option>
              ))}
            </select>
          </label>
          <p className="m-0 text-xs text-neo-text-secondary">El primer participante que acierte recibe el premio hasta completar el número de ganadores. Una respuesta por QR.</p>
        </div>
      )}
      {special && (
        <label className="check-label col-span-full rounded-control border border-neo-accent-border bg-neo-accent-soft p-4">
          <input type="checkbox" checked={values.config?.pending_review === false}
            onChange={(e) => update('config', { ...values.config, pending_review: !e.target.checked })} />
          Confirmo que revisé reglas, condiciones, respuestas correctas y cantidades de premios. La actividad puede activarse.
        </label>
      )}
      {cloneMode && (
        <p className="col-span-full m-0 rounded-control bg-neo-muted-bg p-4 text-sm text-neo-text-secondary">
          Esta copia será un borrador sin resultados anteriores. Revisa las reglas y vuelve a
          seleccionar la actividad requerida, si aplica, antes de activarla.
        </p>
      )}
      {!cloneMode && (
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
      )}
      {challenge && (
        <p className="col-span-full m-0 rounded-control border border-neo-accent-border bg-neo-accent-soft p-4 text-sm text-neo-text-secondary">
          <strong className="text-neo-accent-text">Cómo funcionará:</strong> al completar el reto,
          el personal entra en «En vivo» y escanea el QR del corredor. Cada persona puede registrar
          la finalización una sola vez.
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
      {(raffle || instantWin || trivia || challenge) && (
        <>
          <label>
            Premio
            <input
              value={values.prize ?? ''}
              required={!challenge}
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
      {raffle && !wheel && (
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
      {raffle && !wheel && (
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
          value={selectedSponsor}
          onChange={(e) => {
            const fields = sponsorFields(e.target.value, values.config)
            update('sponsor_brand_id', fields.sponsor_brand_id)
            update('config', fields.config)
          }}
        >
          <option value="">Sin patrocinador</option>
          {sponsorOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.name}
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
