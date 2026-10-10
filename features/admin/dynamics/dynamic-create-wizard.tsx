'use client'

import { ArrowLeft, ArrowRight, Dices, Gift, ScanLine, Target } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type { CommunityRecord, DynamicRow, DynamicType } from '../types'

const options: { type: DynamicType; name: string; description: string; icon: typeof Dices }[] = [
  {
    type: 'raffle',
    name: 'Sorteo',
    description: 'Elige ganadores entre los participantes elegibles.',
    icon: Dices,
  },
  {
    type: 'qr',
    name: 'Stand o checkpoint',
    description: 'Registra visitas mediante el QR.',
    icon: ScanLine,
  },
  {
    type: 'challenge',
    name: 'Reto',
    description: 'Valida que alguien completó una actividad.',
    icon: Target,
  },
  {
    type: 'instant_win',
    name: 'Premio instantáneo',
    description: 'Cada QR tiene una oportunidad de ganar.',
    icon: Gift,
  },
]

export function DynamicCreateWizard({
  brands,
  dynamics,
  onSave,
  onCancel,
}: {
  brands: CommunityRecord[]
  dynamics: DynamicRow[]
  onSave: (row: DynamicRow) => Promise<void>
  onCancel: () => void
}) {
  const [step, setStep] = useState(1)
  const [type, setType] = useState<DynamicType>('raffle')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [prize, setPrize] = useState('')
  const [count, setCount] = useState(1)
  const [points, setPoints] = useState(10)
  const [requiresCheckin, setRequiresCheckin] = useState(true)
  const [sponsor, setSponsor] = useState('')
  const [eligibleDynamic, setEligibleDynamic] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Reto has its own review step so the validation method is explicit.
  const totalSteps = type === 'challenge' ? 4 : 3
  const hasPrize = type === 'raffle' || type === 'instant_win'
  const stepTwoValid =
    name.trim().length >= 2 &&
    (!hasPrize || prize.trim().length > 0) &&
    (type !== 'challenge' || description.trim().length >= 10)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < totalSteps) {
      if (step === 2 && !stepTwoValid) {
        setError(type === 'challenge' ? 'Explica qué debe completar el corredor (mínimo 10 caracteres).' : 'Revisa el nombre y el premio.')
        return
      }
      setError('')
      setStep(step + 1)
      return
    }
    if (!stepTwoValid) return
    setBusy(true)
    setError('')
    try {
      await onSave({
        id: 'new-' + Date.now(),
        name: name.trim(),
        description: description.trim(),
        type,
        status: 'draft',
        prize: hasPrize ? prize.trim() : '',
        winner_count: hasPrize ? count : 1,
        points: hasPrize ? 0 : points,
        sponsor_brand_id: sponsor || null,
        eligibility_dynamic_id: type === 'raffle' ? eligibleDynamic || null : null,
        requires_checkin: requiresCheckin,
        config:
          type === 'raffle'
            ? { exclude_winners: true }
            : type === 'instant_win'
              ? { win_probability: 0.1 }
              : type === 'challenge'
                ? { validation_method: 'staff_scan' }
                : {},
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos guardar la dinámica.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="rounded-card border border-neo-border bg-neo-surface p-5 md:p-8"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-bold tracking-widest text-neo-accent-text uppercase">
            Paso {step} de {totalSteps}
          </p>
          <h2 className="m-0 mt-2 text-2xl font-bold tracking-tight">
            {step === 1
              ? '¿Qué quieres organizar?'
              : step === 2
                ? (type === 'challenge' ? 'Define la meta del reto' : 'Dale identidad')
                : step === 3
                  ? (type === 'challenge' ? 'Cómo se valida el reto' : '¿Quién puede participar?')
                  : 'Revisa antes de guardar'}
          </h2>
          <p className="m-0 mt-1 text-sm text-neo-text-secondary">
            {step === 1
              ? 'Elige una experiencia. Después podrás modificar sus reglas.'
              : step === 2
                ? (type === 'challenge'
                  ? 'Explica exactamente qué debe lograr el corredor.'
                  : 'Solo te pedimos lo necesario para dejarla en borrador.')
                : step === 3
                  ? (type === 'challenge'
                    ? 'El personal valida el reto con el QR del corredor.'
                    : 'Define las condiciones básicas; la activación se hace después.')
                  : 'Comprueba las reglas. El reto no se activará todavía.'}
          </p>
        </div>
        <button className="text-link shrink-0" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.type}
                type="button"
                aria-pressed={type === option.type}
                onClick={() => setType(option.type)}
                className={
                  'min-h-36 rounded-card border p-5 text-left transition-colors ' +
                  (type === option.type
                    ? 'border-neo-accent-text bg-neo-accent-soft'
                    : 'border-neo-border-strong hover:bg-neo-muted-bg')
                }
              >
                <Icon aria-hidden className="mb-3 size-6 text-neo-accent-text" />
                <strong className="block text-lg">{option.name}</strong>
                <span className="mt-2 block text-sm text-neo-text-secondary">
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            {type === 'challenge' ? 'Nombre del reto' : 'Nombre de la dinámica'}
            <input
              autoFocus
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'challenge' ? 'Ej. Completa el circuito de 200 metros' : 'Ej. Pack Hidratación'}
            />
          </label>
          <label className="sm:col-span-2">
            {type === 'challenge' ? '¿Qué debe hacer el corredor para completar el reto? *' : 'Descripción (opcional)'}
            <textarea
              rows={type === 'challenge' ? 4 : 2}
              required={type === 'challenge'}
              minLength={type === 'challenge' ? 10 : undefined}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'challenge'
                ? 'Ej. Completa el circuito de 200 m. El personal comprueba que terminó y escanea su pase.'
                : '¿Cómo funciona?'}
            />
            {type === 'challenge' && (
              <small>Estas son las instrucciones que verá el equipo cuando gestione el reto.</small>
            )}
          </label>
          {hasPrize ? (
            <>
              <label>
                ¿Qué premio se entrega?
                <input
                  required
                  maxLength={240}
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                />
              </label>
              <label>
                Número máximo de ganadores
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) =>
                    setCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                  }
                />
              </label>
            </>
          ) : type !== 'challenge' ? (
            <label>
              ¿Cuántos puntos gana el participante?
              <input
                type="number"
                min={0}
                max={100000}
                value={points}
                onChange={(e) => setPoints(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
          ) : null}
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-5">
          {type === 'challenge' && (
            <>
              <div className="rounded-card border border-neo-accent-border bg-neo-accent-soft p-4">
                <p className="m-0 font-bold text-neo-accent-text">Validación por el equipo con QR</p>
                <p className="m-0 mt-2 text-sm text-neo-text-secondary">
                  Cuando el corredor complete el reto, el personal abre «En vivo»,
                  escanea su pase y registra una participación. Solo se admite una
                  validación por persona.
                </p>
                <p className="m-0 mt-2 text-xs text-neo-text-secondary">
                  Importante: este módulo aún no cronometra carreras ni ordena
                  corredores por tiempo. Si el reto es «el más rápido», registra
                  los tiempos y el ganador por separado.
                </p>
              </div>
              <label>
                Puntos por completar el reto
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={points}
                  onChange={(e) => setPoints(Math.max(0, Number(e.target.value) || 0))}
                />
                <small>Puedes dejarlo en 0 si el reto no entrega puntos.</small>
              </label>
            </>
          )}
          <label className="check-label">
            <input
              type="checkbox"
              checked={requiresCheckin}
              onChange={(e) => setRequiresCheckin(e.target.checked)}
            />
            Solo pueden participar corredores con check-in
          </label>
          {type === 'raffle' && (
            <label>
              Participantes que completaron otra dinámica (opcional)
              <select value={eligibleDynamic} onChange={(e) => setEligibleDynamic(e.target.value)}>
                <option value="">No es necesario completar otra actividad</option>
                {dynamics
                  .filter((item) => item.type !== 'raffle')
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label>
            Patrocinador (opcional)
            <select value={sponsor} onChange={(e) => setSponsor(e.target.value)}>
              <option value="">Sin patrocinador</option>
              {brands
                .filter((brand) => brand.active)
                .map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
            </select>
          </label>
          {type !== 'challenge' && (
            <div className="rounded-control bg-neo-muted-bg p-4 text-sm text-neo-text-secondary">
              Se guardará como <strong>Borrador</strong>. Ningún corredor participa hasta que lo
              actives. Podrás editar los ajustes desde «Preparación».
            </div>
          )}
        </div>
      )}

      {step === 4 && type === 'challenge' && (
        <div className="grid gap-4">
          <div className="rounded-card border border-neo-border bg-neo-muted-bg p-5">
            <p className="m-0 text-xs font-bold tracking-wide text-neo-accent-text uppercase">
              Resumen del reto
            </p>
            <h3 className="m-0 mt-2 text-xl font-black">{name.trim()}</h3>
            <p className="m-0 mt-2 whitespace-pre-wrap text-sm text-neo-text-secondary">
              {description.trim()}
            </p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-neo-text-secondary">Validación</dt><dd className="m-0 font-bold">Personal · escaneo QR</dd></div>
              <div><dt className="text-neo-text-secondary">Participaciones</dt><dd className="m-0 font-bold">Una por corredor</dd></div>
              <div><dt className="text-neo-text-secondary">Puntos</dt><dd className="m-0 font-bold">{points} por completar</dd></div>
              <div><dt className="text-neo-text-secondary">Check-in requerido</dt><dd className="m-0 font-bold">{requiresCheckin ? 'Sí' : 'No'}</dd></div>
              <div><dt className="text-neo-text-secondary">Patrocinador</dt><dd className="m-0 font-bold">{brands.find((brand) => brand.id === sponsor)?.name ?? 'Sin patrocinador'}</dd></div>
              <div><dt className="text-neo-text-secondary">Estado al guardar</dt><dd className="m-0 font-bold">Borrador</dd></div>
            </dl>
          </div>
          <p className="m-0 text-sm text-neo-text-secondary">
            Después de guardar, abre «Preparación» para revisar y activar. Luego usa
            «En vivo» para escanear a quienes hayan completado el reto.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-neo-danger">
          {error}
        </p>
      )}
      <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-neo-border pt-5">
        {step > 1 ? (
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setStep(step - 1)}
            disabled={busy}
          >
            <ArrowLeft aria-hidden className="size-4" /> Volver
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="button" disabled={busy || (step >= 2 && !stepTwoValid)}>
          {step === totalSteps
            ? (busy ? 'Guardando…' : type === 'challenge' ? 'Guardar reto como borrador' : 'Guardar borrador')
            : 'Continuar'}
          {step < totalSteps && <ArrowRight aria-hidden className="size-4" />}
        </button>
      </div>
    </form>
  )
}
