'use client'

import { ArrowUpRight, Dices, Eye, MonitorPlay, Play, RotateCcw, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { callAdmin } from '../api'
import type { DynamicRow, DynamicStageStatus } from '../types'

const phases: Record<string, string> = {
  ready: 'En espera',
  countdown: 'Cuenta atrás iniciada',
  reveal: 'Revelando ganadores',
  finished: 'Finalizada',
}

export function GameControlPanel({
  dynamic,
  onDraw,
  onShowWinners,
}: {
  dynamic: DynamicRow
  onDraw: () => void
  onShowWinners: () => void
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
    if (dynamic.type !== 'raffle' || dynamic.status === 'draft') return
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
  const phase = stage?.phase ?? 'ready'
  const total = dynamic.winners_count ?? 0
  const shown = stage?.shown_count ?? 0
  const active = dynamic.status === 'open' || dynamic.status === 'completed'

  return (
    <section className="grid gap-5">
      <div className="rounded-card border border-neo-border bg-neo-surface p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold tracking-widest text-neo-accent-text uppercase">
              Modo evento · Control
            </p>
            <h3 className="m-0 mt-2 text-xl font-bold">
              {isRaffle ? 'Dirige el sorteo' : 'Registra las participaciones'}
            </h3>
            <p className="m-0 mt-2 text-sm text-neo-text-secondary">
              {isRaffle
                ? 'Controla desde aquí la cuenta atrás y revela cada ganador en la pantalla pública.'
                : 'Abre el escáner en la sección Control. La pantalla pública muestra el avance.'}
            </p>
          </div>
          <span className="rounded-full border border-neo-border px-3 py-2 text-xs font-bold">
            {active ? (phases[phase] ?? phase) : 'Activa primero la dinámica'}
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-neo-danger">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-4 text-sm text-neo-accent-text">
            {notice}
          </p>
        )}

        {isRaffle && active && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {dynamic.status === 'open' && (
              <>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => void command('countdown')}
                >
                  <Play aria-hidden className="size-4" /> Iniciar cuenta atrás
                </button>
                <button type="button" className="button" disabled={busy} onClick={onDraw}>
                  <Dices aria-hidden className="size-4" /> Confirmar sorteo real
                </button>
              </>
            )}
            {dynamic.status === 'completed' && phase === 'ready' && (
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => void command('drawn')}
              >
                <Play aria-hidden className="size-4" /> Preparar revelación
              </button>
            )}
            {dynamic.status === 'completed' && phase === 'countdown' && (
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => void command('drawn')}
              >
                <Play aria-hidden className="size-4" /> Preparar ganadores
              </button>
            )}
            {dynamic.status === 'completed' && phase === 'reveal' && (
              <>
                <button
                  type="button"
                  className="button"
                  disabled={busy || shown >= total}
                  onClick={() => void command('next')}
                >
                  <Eye aria-hidden className="size-4" />
                  Revelar siguiente ({Math.min(shown + 1, total)} de {total})
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={busy || shown < total}
                  onClick={() => void command('finish')}
                >
                  <Trophy aria-hidden className="size-4" /> Finalizar juego
                </button>
              </>
            )}
            {dynamic.status === 'completed' && (
              <button
                type="button"
                className="button button-secondary"
                disabled={busy}
                onClick={onShowWinners}
              >
                <Trophy aria-hidden className="size-4" /> Lista de ganadores
              </button>
            )}
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    'La pantalla volverá a espera. No se borrarán los ganadores. ¿Continuar?',
                  )
                )
                  void command('ready')
              }}
            >
              <RotateCcw aria-hidden className="size-4" /> Volver a espera
            </button>
          </div>
        )}
        {isRaffle && dynamic.status === 'draft' && (
          <p className="mt-5 text-sm text-neo-text-secondary">
            Activa el borrador desde Resumen para empezar.
          </p>
        )}
      </div>

      <div className="rounded-card border border-neo-border bg-neo-surface p-5 md:p-6">
        <div className="flex items-center gap-2">
          <MonitorPlay aria-hidden className="size-6 text-neo-accent-text" />
          <h3 className="m-0 text-lg font-bold">Pantalla pública</h3>
        </div>
        <p className="mt-2 text-sm text-neo-text-secondary">
          Abre el juego en otra pestaña o dispositivo. Su contenido se sincroniza aproximadamente
          cada 2 segundos. No muestra correos, documentos ni controles del staff.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/juego/${dynamic.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="button"
          >
            Abrir pantalla real <ArrowUpRight aria-hidden className="size-4" />
          </Link>
          <Link
            href={`/juego/${dynamic.id}?ensayo=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
          >
            Ensayar con datos ficticios <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
