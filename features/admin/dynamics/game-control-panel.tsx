'use client'

import { ArrowUpRight, Dices, Eye, MonitorPlay, Play, RotateCcw, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { callAdmin } from '../api'
import type { DynamicRow, DynamicStageStatus } from '../types'
import { gamePrimaryAction } from './primary-action'

const phases: Record<string, string> = {
  ready: 'En espera',
  countdown: 'Cuenta atrás iniciada',
  reveal: 'Revelando ganadores',
  finished: 'Juego finalizado',
}

export function GameControlPanel({
  dynamic,
  onDraw,
}: {
  dynamic: DynamicRow
  onDraw: () => void
}) {
  const [stage, setStage] = useState<DynamicStageStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    const result = await callAdmin('dynamicData', { operation: 'stageStatus', id: dynamic.id })
    setStage(result.stage ?? { phase: 'ready', shown_count: 0 })
  }, [dynamic.id])

  useEffect(() => {
    if (dynamic.type !== 'raffle' || !['open', 'completed'].includes(dynamic.status)) return
    void refresh().catch(() => setError('No pudimos conectar con la pantalla de juego.'))
    const poll = window.setInterval(() => void refresh().catch(() => undefined), 2000)
    return () => window.clearInterval(poll)
  }, [dynamic.type, dynamic.status, refresh])

  async function command(action: 'ready' | 'countdown' | 'drawn' | 'next' | 'finish') {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await callAdmin('dynamicData', {
        operation: 'stage',
        id: dynamic.id,
        command: action,
      })
      setStage(result.stage ?? null)
      setNotice('La pantalla pública se actualizó.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos actualizar el juego.')
    } finally {
      setBusy(false)
    }
  }

  const isRaffle = dynamic.type === 'raffle'
  const active = dynamic.status === 'open' || dynamic.status === 'completed'
  const phase = stage?.phase ?? 'ready'
  const total = dynamic.winners_count ?? 0
  const shown = stage?.shown_count ?? 0
  const action = gamePrimaryAction(dynamic.status, stage, total)

  const labels = {
    countdown: 'Iniciar cuenta atrás',
    draw: 'Realizar sorteo',
    prepare: 'Preparar ganadores',
    next: `Revelar ganador ${Math.min(shown + 1, total)} de ${total}`,
    finish: 'Finalizar presentación',
  }

  function primary() {
    if (action === 'draw') onDraw()
    else if (action === 'countdown') void command('countdown')
    else if (action === 'prepare') void command('drawn')
    else if (action === 'next') void command('next')
    else if (action === 'finish') void command('finish')
  }

  return (
    <section className="rounded-card border border-neo-border bg-neo-surface p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-widest text-neo-accent-text uppercase">
            Día del evento
          </p>
          <h3 className="m-0 mt-2 text-xl font-bold">
            {isRaffle ? 'Control del sorteo' : 'Participaciones'}
          </h3>
          <p className="m-0 mt-1 text-sm text-neo-text-secondary">
            {isRaffle
              ? 'Una acción a la vez. El público solo ve lo que reveles desde aquí.'
              : 'Registra corredores desde el escáner y muestra el progreso en pantalla.'}
          </p>
        </div>
        {active && (
          <span className="rounded-full border border-neo-border px-3 py-2 text-xs font-bold">
            {isRaffle ? phases[phase] ?? phase : 'Activa'}
          </span>
        )}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-neo-danger">{error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-neo-accent-text">{notice}</p>}

      {isRaffle && (
        <div className="mt-6">
          {!active ? (
            <p className="m-0 rounded-control bg-neo-muted-bg p-4 text-sm text-neo-text-secondary">
              Activa esta dinámica desde Preparación para poder iniciar el juego.
            </p>
          ) : action ? (
            <button
              type="button"
              className="button min-h-14 w-full justify-center text-base sm:w-auto"
              disabled={busy}
              onClick={primary}
            >
              {action === 'draw' ? <Dices aria-hidden className="size-5" /> :
                action === 'next' ? <Eye aria-hidden className="size-5" /> :
                  action === 'finish' ? <Trophy aria-hidden className="size-5" /> :
                    <Play aria-hidden className="size-5" />}
              {busy ? 'Actualizando…' : labels[action]}
            </button>
          ) : (
            <p className="m-0 rounded-control bg-neo-success-bg p-4 text-sm font-bold">
              Presentación terminada. Los resultados siguen guardados.
            </p>
          )}
          {dynamic.status === 'completed' && phase === 'reveal' && (
            <p className="m-0 mt-3 text-sm text-neo-text-secondary">
              {shown} de {total} ganadores mostrados al público.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neo-border pt-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MonitorPlay aria-hidden className="size-4 text-neo-accent-text" />
          <span>Pantalla para proyectar</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {active && (
            <Link
              href={`/juego/${dynamic.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Abrir pantalla <ArrowUpRight aria-hidden className="size-4" />
            </Link>
          )}
          <details className="group relative">
            <summary className="cursor-pointer list-none text-sm font-semibold text-neo-text-secondary hover:text-neo-text">
              Más opciones <span aria-hidden>⌄</span>
            </summary>
            <div className="mt-3 flex min-w-56 flex-col gap-3 rounded-control border border-neo-border bg-neo-muted-bg p-4 sm:absolute sm:right-0 sm:z-10 sm:shadow-lg">
              <Link
                href={`/juego/${dynamic.id}?ensayo=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link text-sm"
              >
                Ensayar con datos ficticios <ArrowUpRight aria-hidden className="size-4" />
              </Link>
              {isRaffle && active && (
                <>
                  {dynamic.status === 'open' && phase !== 'countdown' && (
                    <button type="button" className="text-link text-left text-sm" disabled={busy} onClick={onDraw}>
                      <Dices aria-hidden className="size-4" /> Sortear sin cuenta atrás
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-link text-left text-sm"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm('¿Reiniciar solo la presentación? Los ganadores no se borrarán.')) {
                        void command('ready')
                      }
                    }}
                  >
                    <RotateCcw aria-hidden className="size-4" /> Reiniciar presentación
                  </button>
                </>
              )}
              <p className="m-0 text-xs text-neo-text-secondary">
                El ensayo no modifica participaciones ni resultados.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}
