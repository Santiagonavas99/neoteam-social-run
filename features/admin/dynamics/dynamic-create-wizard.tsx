'use client'

import { ArrowLeft, ArrowRight, Dices, Gift, ScanLine, Target } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { CommunityRecord, DynamicRow, DynamicType } from '../types'

const options: { type: DynamicType; name: string; description: string; icon: typeof Dices }[] = [
  { type: 'raffle', name: 'Sorteo', description: 'Elige ganadores entre los participantes elegibles.', icon: Dices },
  { type: 'qr', name: 'Stand o checkpoint', description: 'Registra visitas mediante el QR.', icon: ScanLine },
  { type: 'challenge', name: 'Reto', description: 'Valida que alguien completó una actividad.', icon: Target },
  { type: 'instant_win', name: 'Premio instantáneo', description: 'Cada QR tiene una oportunidad de ganar.', icon: Gift },
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

  const hasPrize = type === 'raffle' || type === 'instant_win'
  const stepTwoValid = name.trim().length >= 2 && (!hasPrize || prize.trim().length > 0)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < 3) {
      if (step === 2 && !stepTwoValid) return
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
        config: type === 'raffle' ? { exclude_winners: true } : type === 'instant_win' ? { win_probability: 0.1 } : {},
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos guardar la dinámica.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-card border border-neo-border bg-neo-surface p-5 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-bold tracking-widest text-neo-accent-text uppercase">
            Paso {step} de 3
          </p>
          <h2 className="m-0 mt-2 text-2xl font-bold tracking-tight">
            {step === 1 ? '¿Qué quieres organizar?' : step === 2 ? 'Dale identidad' : '¿Quién puede participar?'}
          </h2>
          <p className="m-0 mt-1 text-sm text-neo-text-secondary">
            {step === 1 ? 'Elige una experiencia. Después podrás modificar sus reglas.' :
              step === 2 ? 'Solo te pedimos lo necesario para dejarla en borrador.' :
              'Define las condiciones básicas; la activación se hace después.'}
          </p>
        </div>
        <button className="text-link shrink-0" type="button" onClick={onCancel}>Cancelar</button>
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
                className={'min-h-36 rounded-card border p-5 text-left transition-colors ' +
                  (type === option.type ? 'border-neo-accent-text bg-neo-accent-soft' :
                    'border-neo-border-strong hover:bg-neo-muted-bg')}
              >
                <Icon aria-hidden className="mb-3 size-6 text-neo-accent-text" />
                <strong className="block text-lg">{option.name}</strong>
                <span className="mt-2 block text-sm text-neo-text-secondary">{option.description}</span>
              </button>
            )
          })}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">Nombre de la dinámica
            <input autoFocus required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Pack Hidratación" />
          </label>
          <label className="sm:col-span-2">Descripción (opcional)
            <textarea rows={2} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Cómo funciona?" />
          </label>
          {hasPrize ? (
            <>
              <label>¿Qué premio se entrega?
                <input required maxLength={240} value={prize} onChange={(e) => setPrize(e.target.value)} />
              </label>
              <label>Número máximo de ganadores
                <input type="number" required min={1} max={500} value={count} onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} />
              </label>
            </>
          ) : (
            <label>¿Cuántos puntos gana el participante?
              <input type="number" min={0} max={100000} value={points} onChange={(e) => setPoints(Math.max(0, Number(e.target.value) || 0))} />
            </label>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-5">
          <label className="check-label">
            <input type="checkbox" checked={requiresCheckin} onChange={(e) => setRequiresCheckin(e.target.checked)} />
            Solo pueden participar corredores con check-in
          </label>
          {type === 'raffle' && (
            <label>Participantes que completaron otra dinámica (opcional)
              <select value={eligibleDynamic} onChange={(e) => setEligibleDynamic(e.target.value)}>
                <option value="">No es necesario completar otra actividad</option>
                {dynamics.filter((item) => item.type !== 'raffle').map((item) =>
                  <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          <label>Patrocinador (opcional)
            <select value={sponsor} onChange={(e) => setSponsor(e.target.value)}>
              <option value="">Sin patrocinador</option>
              {brands.filter((brand) => brand.active).map((brand) =>
                <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
          </label>
          <div className="rounded-control bg-neo-muted-bg p-4 text-sm text-neo-text-secondary">
            Se guardará como <strong>Borrador</strong>. Ningún corredor participa hasta que lo actives.
            Los ajustes avanzados se encuentran en la sección «Configuración».
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-neo-danger">{error}</p>}
      <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-neo-border pt-5">
        {step > 1 ? (
          <button type="button" className="button button-secondary" onClick={() => setStep(step - 1)} disabled={busy}>
            <ArrowLeft aria-hidden className="size-4" /> Volver
          </button>
        ) : <span />}
        <button type="submit" className="button" disabled={busy || (step >= 2 && !stepTwoValid)}>
          {step === 3 ? (busy ? 'Guardando…' : 'Guardar borrador') : 'Continuar'}
          {step < 3 && <ArrowRight aria-hidden className="size-4" />}
        </button>
      </div>
    </form>
  )
}
