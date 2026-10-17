'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { callAdmin } from '../api'
import { ScanStation } from '../ui/scan-station'
import { formatElapsed, rankTimes, remainingStock } from './mechanics-helpers'
import type { DynamicRow, TimedRun, TriviaAnswer, WheelSpin } from '../types'

type Kind = 'timed' | 'wheel' | 'trivia'
type MechanicsProps = { dynamic: DynamicRow; resultsOnly?: boolean }

export function mechanicKind(row: DynamicRow): Kind | null {
  if (row.type === 'trivia') return 'trivia'
  if (row.type === 'challenge' &&
    ['timed_max','timed_min','team_relay'].includes(String(row.config?.challenge_mode))) return 'timed'
  if (row.type === 'raffle' && ['wheel','ruleta_pendiente'].includes(String(row.config?.mechanic))) return 'wheel'
  return null
}

function participantName(registrations?: { first_name: string; last_name: string } | null) {
  return registrations ? [registrations.first_name, registrations.last_name].filter(Boolean).join(' ') : 'Corredor'
}

function duration(run: TimedRun, now: number): number {
  if (run.status !== 'running' || !run.running_at) return run.elapsed_ms
  return run.elapsed_ms + Math.max(0, now - Date.parse(run.running_at))
}

function MechanicsPanel({ dynamic, resultsOnly = false }: MechanicsProps) {
  const kind = mechanicKind(dynamic)
  const mode = String(dynamic.config?.challenge_mode ?? '')
  const isTeam = mode === 'team_relay'
  const isFastest = mode !== 'timed_max'
  const [code, setCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamCodes, setTeamCodes] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [choice, setChoice] = useState<number | null>(null)
  const [timed, setTimed] = useState<TimedRun[]>([])
  const [spins, setSpins] = useState<WheelSpin[]>([])
  const [answers, setAnswers] = useState<TriviaAnswer[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [outcome, setOutcome] = useState<{ already_played: boolean; won: boolean; prize?: string | null; correct?: boolean } | null>(null)
  const [clock, setClock] = useState(() => Date.now())
  const [correctionId, setCorrectionId] = useState<string | null>(null)
  const [correctSeconds, setCorrectSeconds] = useState('')
  const [reason, setReason] = useState('')
  const configured = dynamic.config?.pending_review !== true
  const active = dynamic.status === 'open' && configured

  const reload = useCallback(async () => {
    if (kind === 'timed') {
      const result = await callAdmin('dynamicData', { operation: 'timedResults', id: dynamic.id })
      setTimed(result.timedRuns ?? [])
    } else if (kind === 'wheel') {
      const result = await callAdmin('dynamicData', { operation: 'wheelResults', id: dynamic.id })
      setSpins(result.wheelSpins ?? [])
    } else if (kind === 'trivia') {
      const result = await callAdmin('dynamicData', { operation: 'triviaResults', id: dynamic.id })
      setAnswers(result.triviaAnswers ?? [])
    }
  }, [dynamic.id, kind])

  useEffect(() => {
    void reload().catch((cause) => setError(cause instanceof Error ? cause.message : 'No pudimos consultar resultados.'))
  }, [reload])

  useEffect(() => {
    if (kind !== 'timed' || resultsOnly || !timed.some((row) => row.status === 'running')) return
    const handle = window.setInterval(() => setClock(Date.now()), 100)
    return () => window.clearInterval(handle)
  }, [kind, resultsOnly, timed])

  const ranking = useMemo(() => rankTimes(timed, isFastest ? 'min' : 'max'), [timed, isFastest])

  async function operate(operation: string, extra: Record<string, unknown>) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await callAdmin('dynamicData', { operation, id: dynamic.id, ...extra })
      if (result.mechanicResult) setOutcome(result.mechanicResult)
      if (operation === 'timedAction') {
        setMessage(extra.command === 'correct' ? 'Corrección registrada con auditoría.' : 'Cronómetro actualizado en el servidor.')
      }
      if (operation === 'wheelSpin' || operation === 'triviaAnswer') setCode('')
      await reload()
      if (operation === 'timedAction' && extra.command === 'start') {
        setCode('')
        setTeamCodes('')
        setTeamName('')
      }
      if (extra.command === 'correct') {
        setCorrectionId(null)
        setReason('')
        setCorrectSeconds('')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la acción.')
    } finally {
      setBusy(false)
    }
  }

  if (!kind) return null
  const wheelPrizes = Array.isArray(dynamic.config?.wheel_prizes)
    ? dynamic.config.wheel_prizes as Array<{ id: string; label: string; quantity: number; weight: number }>
    : []
  const wheelStock = remainingStock(wheelPrizes, spins)
  const options = Array.isArray(dynamic.config?.trivia_options) ?
    dynamic.config.trivia_options.filter((x): x is string => typeof x === 'string') : []

  return (
    <section className="rounded-card border border-neo-border bg-neo-surface p-4 md:p-6" aria-label="Mecánica de la dinámica">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="m-0 text-lg font-black">
            {kind === 'timed' ? (isTeam ? 'Cronómetro de relevos' : 'Cronómetro de reto') :
              kind === 'wheel' ? 'Ruleta de premios' : 'Trivia presencial'}
          </h3>
          <p className="m-0 mt-1 text-sm text-neo-text-secondary">
            {kind === 'timed' ? (isFastest ? 'Gana el menor tiempo válido.' : 'Gana el mayor tiempo válido.') :
              kind === 'wheel' ? 'El servidor determina y guarda cada premio antes de revelarlo.' :
                'Un intento por corredor. La respuesta se valida en el servidor.'}
          </p>
        </div>
        <button type="button" onClick={() => void reload()} disabled={busy}
          className="min-h-11 rounded-control border border-neo-border px-3 text-sm font-bold">
          Actualizar
        </button>
      </div>
      {!resultsOnly && !active && (
        <p role="status" className="rounded-control border border-neo-border bg-neo-muted-bg p-3 text-sm">
          {configured ? 'Esta actividad debe estar activa para operar.' :
            'Antes de activarla, confirma las reglas, preguntas y premios en Preparación.'}
        </p>
      )}
      {!resultsOnly && active && (
        <div className="mb-4">
          <button type="button" className="button button-secondary w-full"
            onClick={() => setCameraOpen((value) => !value)}>
            {cameraOpen ? 'Cerrar cámara' : 'Escanear QR con cámara'}
          </button>
          {cameraOpen && (
            <div className="mt-3">
              <ScanStation
                inputId={'mechanic-code-' + dynamic.id}
                title="Escanear participante"
                helper={isTeam ? 'Escanea los QR de cada integrante y después inicia el cronómetro.' :
                  'El QR se captura aquí. Confirma la operación principal para registrar el resultado.'}
                onCode={async (scanned) => {
                  if (isTeam && kind === 'timed') {
                    const current = teamCodes.split(',').map((value) => value.trim()).filter(Boolean)
                    if (current.includes(scanned)) return { tone: 'warning', headline: 'Código ya capturado' }
                    setTeamCodes([...current,scanned].join(', '))
                    return { tone: 'success', headline: 'Integrante añadido', detail: 'Escanea el siguiente o inicia el relevo.' }
                  }
                  setCode(scanned)
                  return { tone: 'success', headline: 'QR capturado', detail: 'Ya puedes confirmar la actividad.' }
                }}
              />
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="my-3 text-sm text-neo-danger">{error}</p>}
      {message && <p role="status" className="my-3 text-sm text-neo-accent-text">{message}</p>}
      {kind === 'timed' && (
        <div className="space-y-4">
          {!resultsOnly && active && (
            <div className="grid gap-3">
              {isTeam && (
                <label>Nombre del equipo
                  <input value={teamName} maxLength={80} onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Ej. Los Rayos" />
                </label>
              )}
              <label>{isTeam ? 'Códigos QR de los integrantes (separados por coma)' : 'Código QR del participante'}
                <input value={isTeam ? teamCodes : code}
                  onChange={(event) => isTeam ? setTeamCodes(event.target.value) : setCode(event.target.value)}
                  placeholder={isTeam ? 'SR26-12345, SR26-67890' : 'SR26-12345'}
                  autoComplete="off" />
              </label>
              <button type="button" className="button w-full" disabled={busy || (isTeam ? !teamName.trim() || teamCodes.split(',').filter(Boolean).length < 2 : !code.trim())}
                onClick={() => void operate('timedAction', {
                  command: 'start', teamName: isTeam ? teamName : undefined,
                  codes: isTeam ? teamCodes.split(',').map((x) => x.trim()).filter(Boolean) : [code.trim()],
                })}>
                Iniciar nuevo cronómetro
              </button>
            </div>
          )}
          {timed.filter((row) => row.status !== 'finished').map((run) => (
            <article key={run.id} className="rounded-control border border-neo-border p-4">
              <p className="m-0 text-sm font-bold">{run.team_name || participantName(run.registrations)}</p>
              <p className="my-3 font-mono text-3xl font-black tabular-nums" aria-live="off">
                {formatElapsed(duration(run, clock))}
              </p>
              <p className="m-0 mb-3 text-xs text-neo-text-secondary">
                {run.status === 'running' ? 'En marcha · valor en pantalla aproximado; el servidor guarda el tiempo oficial' : 'Pausado'}
              </p>
              {!resultsOnly && active && (
                <div className="flex flex-wrap gap-2">
                  {run.status === 'running' ? (
                    <>
                      <button type="button" className="button button-secondary" disabled={busy}
                        onClick={() => void operate('timedAction', { command: 'pause', runId: run.id })}>Pausar</button>
                      <button type="button" className="button" disabled={busy}
                        onClick={() => void operate('timedAction', { command: 'finish', runId: run.id })}>Finalizar</button>
                    </>
                  ) : (
                    <button type="button" className="button" disabled={busy}
                      onClick={() => void operate('timedAction', { command: 'resume', runId: run.id })}>Reanudar</button>
                  )}
                </div>
              )}
            </article>
          ))}
          <h4 className="m-0 text-base font-bold">Clasificación automática</h4>
          {ranking.length ? (
            <ol className="space-y-2">
              {ranking.map(({run,place,tied}) => {
                const inPrizes = place <= dynamic.winner_count
                return (
                  <li key={run.id} className="rounded-control border border-neo-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">
                        {place}. {run.team_name || participantName(run.registrations)}
                      </span>
                      <span className="font-mono text-sm tabular-nums">{formatElapsed(run.elapsed_ms)}</span>
                    </div>
                    <p className="m-0 mt-1 text-xs text-neo-text-secondary">
                      {tied ? 'Tiempo empatado · requiere desempate' :
                        inPrizes ? 'En posición de premio · clasificación provisional' : 'Tiempo registrado'}
                    </p>
                    {!resultsOnly && active && (
                      <button type="button" className="text-link mt-2 text-xs"
                        onClick={() => { setCorrectionId(run.id); setCorrectSeconds(String(run.elapsed_ms/1000)); setReason('') }}>
                        Corregir con motivo
                      </button>
                    )}
                    {correctionId === run.id && !resultsOnly && (
                      <div className="mt-3 grid gap-2">
                        <label>Tiempo oficial en segundos
                          <input type="number" min="0" max="43200" step="0.01" value={correctSeconds}
                            onChange={(event) => setCorrectSeconds(event.target.value)} />
                        </label>
                        <label>Motivo de corrección (mín. 8 caracteres)
                          <textarea rows={2} maxLength={500} value={reason}
                            onChange={(event) => setReason(event.target.value)} />
                        </label>
                        <div className="flex gap-2">
                          <button type="button" className="button" disabled={busy || reason.trim().length < 8 || correctSeconds === ''}
                            onClick={() => void operate('timedAction', {
                              command: 'correct',runId: run.id,
                              correctMs: Math.round(Number(correctSeconds)*1000),reason,
                            })}>Guardar corrección</button>
                          <button type="button" className="button button-secondary" onClick={() => setCorrectionId(null)}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          ) : <p className="text-sm text-neo-text-secondary">No hay tiempos finalizados todavía.</p>}
          <p className="text-xs text-neo-text-secondary">
            Los puestos y premios aún no equivalen a premios entregados. Confirma empates y resultados antes de entregar productos.
          </p>
        </div>
      )}
      {kind === 'wheel' && (
        <div className="space-y-4">
          <div className={'mx-auto flex size-48 items-center justify-center rounded-full border-8 border-neo-border-strong bg-neo-accent-soft text-center shadow-lg' + (busy ? ' motion-safe:animate-spin' : '')}>
            <div className="px-4">
              <p className="m-0 text-xs font-bold tracking-widest uppercase">Social Run</p>
              <strong className="mt-2 block text-xl">RULETA</strong>
              <p className="m-0 mt-2 text-xs text-neo-text-secondary">Resultado oficial desde servidor</p>
            </div>
          </div>
          <div className="rounded-control border border-neo-border p-3">
            <p className="m-0 mb-2 text-sm font-bold">Premios disponibles</p>
            {wheelStock.map((item) => (
              <p key={item.id} className="m-0 mt-1 text-sm">{item.label}: {item.remaining} de {item.quantity}</p>
            ))}
            {!wheelPrizes.length && <p className="text-sm text-neo-text-secondary">Configura premios y cantidades antes de activarla.</p>}
          </div>
          {!resultsOnly && active && (
            <div className="grid gap-3">
              <label>QR o código del corredor
                <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="SR26-12345" />
              </label>
              <button type="button" className="button w-full" disabled={busy || !code.trim()}
                onClick={() => { setOutcome(null); void operate('wheelSpin', { code: code.trim() }) }}>
                {busy ? 'Verificando premio…' : 'Girar ruleta y registrar'}
              </button>
            </div>
          )}
          {outcome && (
            <div role="status" className="rounded-control border border-neo-accent-border bg-neo-accent-soft p-4 text-center">
              <strong className="block text-lg">
                {outcome.won ? '¡Premio! ' + (outcome.prize || '') : 'Sin premio'}
              </strong>
              {outcome.already_played && <p className="mt-2 text-sm">Este corredor ya había girado; no se asignó otro premio.</p>}
            </div>
          )}
          <h4 className="m-0 font-bold">Historial de giros ({spins.length})</h4>
          <ul className="space-y-2">
            {spins.slice(0,60).map((spin,index) => (
              <li key={spin.created_at + index} className="flex justify-between gap-3 rounded-control border border-neo-border p-2 text-sm">
                <span>{participantName(spin.registrations)}</span>
                <strong>{spin.prize_label || 'Sin premio'}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
      {kind === 'trivia' && (
        <div className="space-y-4">
          <h4 className="m-0 text-base font-bold">{String(dynamic.config?.trivia_question || 'Pregunta pendiente de configurar')}</h4>
          {options.map((option,index) => (
            <button type="button" key={index} disabled={busy || resultsOnly || !active}
              aria-pressed={choice === index} onClick={() => setChoice(index)}
              className={'min-h-12 w-full rounded-control border p-3 text-left text-sm ' +
                (choice === index ? 'border-neo-accent-text bg-neo-accent-soft' : 'border-neo-border')}>
              {String.fromCharCode(65+index)}. {option}
            </button>
          ))}
          {!resultsOnly && active && (
            <div className="grid gap-3">
              <label>QR o código del participante
                <input value={code} placeholder="SR26-12345" onChange={(event) => setCode(event.target.value)} />
              </label>
              <button type="button" className="button w-full" disabled={busy || !code.trim() || choice === null}
                onClick={() => { setOutcome(null); void operate('triviaAnswer', { code: code.trim(), choice }) }}>
                Validar respuesta
              </button>
            </div>
          )}
          {outcome && (
            <p role="status" className="rounded-control border border-neo-accent-border bg-neo-accent-soft p-4 text-sm font-bold">
              {outcome.already_played ? 'Este corredor ya había respondido.' :
                !outcome.correct ? 'Respuesta incorrecta.' :
                  outcome.won ? '¡Correcto! Premio asignado.' : 'Respuesta correcta, pero sin premio disponible.'}
            </p>
          )}
          <h4 className="m-0 font-bold">Respuestas registradas ({answers.length})</h4>
          <ul className="space-y-2">
            {answers.slice(0,60).map((entry,index) => (
              <li key={entry.created_at + index} className="flex justify-between gap-2 rounded-control border border-neo-border p-2 text-sm">
                <span>{participantName(entry.registrations)}</span>
                <span>{entry.won ? 'Ganó' : entry.correct ? 'Correcta' : 'Incorrecta'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export { MechanicsPanel }
