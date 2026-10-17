'use client'

import { useState } from 'react'
import { dynamicTypes } from '../labels'
import type { DynamicRow, LogoItem } from '../types'
import { filterMobileDynamics, type MobilePhase, mobilePhaseLabels } from './mobile-dynamics'

const phases: MobilePhase[] = ['en-vivo', 'preparar', 'resultados']

export function MobileDynamicsHome({
  rows,
  logos,
  loading,
  query,
  onQueryChange,
  onOpen,
}: {
  rows: DynamicRow[]
  logos: LogoItem[]
  loading: boolean
  query: string
  onQueryChange: (value: string) => void
  onOpen: (row: DynamicRow) => void
}) {
  const [phase, setPhase] = useState<MobilePhase>('en-vivo')
  const shown = filterMobileDynamics(rows, phase, query)

  return (
    <section className="flex flex-col gap-4 md:hidden" aria-label="Dinámicas móvil">
      <nav className="grid grid-cols-3 gap-2" aria-label="Etapas">
        {phases.map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={phase === item}
            onClick={() => setPhase(item)}
            className={
              'min-h-20 rounded-card border p-3 text-left ' +
              (phase === item
                ? 'border-neo-border-strong bg-neo-accent-soft'
                : 'border-neo-border bg-neo-surface')
            }
          >
            <span className="block text-xs font-bold">{mobilePhaseLabels[item]}</span>
            <strong className="mt-2 block text-2xl tabular-nums">
              {filterMobileDynamics(rows, item, '').length}
            </strong>
          </button>
        ))}
      </nav>
      <label>
        Buscar en todas las dinámicas
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Marca, premio o actividad…"
          className="mt-1 min-h-12"
        />
      </label>
      {loading ? (
        <p role="status" className="text-sm text-neo-text-secondary">
          Cargando dinámicas…
        </p>
      ) : shown.length ? (
        shown.map((row) => (
          <button
            type="button"
            key={row.id}
            onClick={() => onOpen(row)}
            className="min-h-24 w-full rounded-card border border-neo-border bg-neo-surface p-4 text-left"
          >
            <span className="block text-xs text-neo-accent-text">
              {logos.find((logo) => logo.id === row.config?.sponsor_logo_id)?.name ||
                dynamicTypes[row.type]}
            </span>
            <strong className="mt-1 block text-base">{row.name}</strong>
            <span className="mt-1 block text-xs text-neo-text-secondary">
              {row.prize || row.description}
            </span>
          </button>
        ))
      ) : (
        <p className="rounded-card border p-5 text-sm text-neo-text-secondary">
          No hay dinámicas para mostrar en esta etapa.
        </p>
      )}
    </section>
  )
}
