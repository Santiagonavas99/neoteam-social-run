'use client'

import { ArrowRight, Plus, Search, Trophy, Zap } from 'lucide-react'
import { dynamicStates, dynamicTypes } from '../labels'
import type { DynamicRow, LogoItem } from '../types'
import { isSocialRunWheelDraw } from './event-draw-mode'
import { sortMobileDynamics } from './mobile-dynamics'

export function mobileMechanicLabel(row: DynamicRow): string {
  if (isSocialRunWheelDraw(row)) return 'Ruleta · sorteo'
  if (row.type === 'raffle' && row.config?.mechanic === 'wheel') return 'Premio por QR'
  if (row.type === 'raffle') return 'Sorteo'
  if (row.type === 'challenge') {
    if (row.config?.challenge_mode === 'timed_max') return 'Resistencia'
    if (row.config?.challenge_mode === 'timed_min') return 'Tiempo'
    if (row.config?.challenge_mode === 'team_relay') return 'Relevos'
    return 'Reto'
  }
  if (row.type === 'trivia') return 'Trivia'
  if (row.type === 'instant_win') return 'Premio'
  return dynamicTypes[row.type]
}

export function MobileDynamicsHome({
  rows,
  logos,
  loading,
  query,
  onQueryChange,
  onOpen,
  onCreate,
}: {
  rows: DynamicRow[]
  logos: LogoItem[]
  loading: boolean
  query: string
  onQueryChange: (value: string) => void
  onOpen: (row: DynamicRow) => void
  onCreate: () => void
}) {
  const shown = sortMobileDynamics(rows, query)
  const activeCount = rows.filter((row) => row.status === 'open').length
  const draftCount = rows.filter((row) => row.status === 'draft').length
  const finishedCount = rows.filter(
    (row) => row.status === 'completed' || row.status === 'closed',
  ).length

  return (
    <section className="flex flex-col gap-4 md:hidden" aria-label="Dinámicas del evento">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Activas', value: activeCount },
          { label: 'Pendientes', value: draftCount },
          { label: 'Finalizadas', value: finishedCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-card border border-neo-border bg-neo-surface p-3"
          >
            <strong className="block text-2xl font-black tabular-nums">{item.value}</strong>
            <span className="mt-1 block text-xs text-neo-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Buscar dinámica</span>
          <span className="relative block">
            <Search
              aria-hidden
              className="absolute top-3.5 left-3 size-5 text-neo-text-secondary"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar marca o dinámica"
              className="min-h-12 w-full pl-10!"
            />
          </span>
        </label>
        <button
          type="button"
          className="button button-secondary min-h-12 shrink-0 gap-1 px-3"
          onClick={onCreate}
        >
          <Plus aria-hidden className="size-4" /> Nueva
        </button>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-neo-text-secondary">
          Cargando dinámicas…
        </p>
      ) : shown.length > 0 ? (
        <div className="flex flex-col gap-3">
          {shown.map((row) => {
            const status = row.status
            const active = status === 'open'
            const brand = logos.find((logo) => logo.id === row.config?.sponsor_logo_id)?.name
            return (
              <button
                type="button"
                key={row.id}
                onClick={() => onOpen(row)}
                className={`flex min-h-28 w-full flex-col gap-3 rounded-card border p-4 text-left text-neo-text transition-colors active:bg-neo-muted-bg ${
                  active
                    ? 'border-neo-accent-border bg-neo-surface'
                    : 'border-neo-border bg-neo-surface'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 text-xs font-bold tracking-wide text-neo-accent-text uppercase">
                    {brand || mobileMechanicLabel(row)}
                  </span>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${
                      active
                        ? 'border-neo-accent-border bg-neo-accent-soft text-neo-accent-text'
                        : 'border-neo-border bg-neo-muted-bg text-neo-text-secondary'
                    }`}>
                    {active ? 'Activa' : status === 'draft' ? 'Pendiente' : dynamicStates[status]}
                  </span>
                </span>
                <span className="block min-w-0">
                  <strong className="block text-base leading-tight font-black break-words">
                    {row.name}
                  </strong>
                  <span className="mt-1 block text-sm text-neo-text-secondary">
                    {mobileMechanicLabel(row)}
                    {row.prize ? ` · ${row.prize}` : ''}
                  </span>
                </span>
                <span className="flex items-center justify-between text-sm font-bold text-neo-accent-text">
                  <span className="inline-flex items-center gap-2">
                    {active ? (
                      <Zap aria-hidden className="size-4" />
                    ) : status === 'draft' ? (
                      <Plus aria-hidden className="size-4" />
                    ) : (
                      <Trophy aria-hidden className="size-4" />
                    )}
                    {active ? 'Operar' : status === 'draft' ? 'Configurar' : 'Ver resultado'}
                  </span>
                  <ArrowRight aria-hidden className="size-4" />
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="rounded-card border border-neo-border p-5 text-sm text-neo-text-secondary">
          {query ? 'No encontramos dinámicas con esa búsqueda.' : 'Todavía no hay dinámicas.'}
        </p>
      )}
    </section>
  )
}
