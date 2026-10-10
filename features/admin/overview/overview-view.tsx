'use client'

import { ChevronRight } from 'lucide-react'
import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import { dynamicStates, dynamicTypes } from '../labels'
import type { AdminSection } from '../sections'
import type { DynamicRow, FeedbackValue, Metrics } from '../types'
import { Feedback, StatusBadge } from '../ui/admin-ui'
import { LoadingState } from '../ui/loading-state'
import { RefreshButton } from '../ui/refresh-button'
import { useAdminData } from '../ui/use-admin-data'

type Overview = { metrics: Metrics | null; active: DynamicRow[] }

export function OverviewView({ navigate }: { navigate: (section: AdminSection) => void }) {
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const onError = useCallback(
    (error: unknown) => setFeedback({ kind: 'error', text: errorMessage(error) }),
    [],
  )
  const load = useCallback(async (): Promise<Overview> => {
    const [summary, dynamics] = await Promise.all([
      callAdmin('adminData', { resource: 'metrics', operation: 'list' }),
      callAdmin('dynamicData', { operation: 'list' }),
    ])
    return {
      metrics: summary.metrics ?? null,
      active: (dynamics.dynamicRows ?? []).filter((row) => row.status === 'open'),
    }
  }, [])
  const { data, loading, reload } = useAdminData<Overview>(
    load,
    { metrics: null, active: [] },
    onError,
  )
  const { metrics, active } = data
  const registered = metrics?.registered ?? 0
  const checkedIn = metrics?.checkedIn ?? 0

  const secondary = [
    ['Dinámicas', metrics?.dynamics],
    ['Grupos', metrics?.groups],
    ['Marcas', metrics?.brands],
  ] as const

  return (
    <section aria-busy={loading} className="flex flex-col gap-4">
      <div className="flex justify-end">
        <RefreshButton
          loading={loading}
          disabled={loading}
          onClick={() => {
            setFeedback(null)
            void reload()
          }}
        />
      </div>
      <Feedback value={feedback} />
      {loading ? (
        <LoadingState>Cargando resumen…</LoadingState>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-neo-border bg-neo-border md:grid-cols-5">
            <div className="col-span-3 flex flex-col gap-1 bg-neo-black p-4 text-neo-white md:col-span-2 md:p-5">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-neo-on-dark-secondary">
                Check-in
              </p>
              <p className="m-0 text-[40px] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                <span className="text-neo-accent">{checkedIn}</span>
                <span className="text-2xl text-neo-on-dark-secondary"> / {registered}</span>
              </p>
              <div
                role="progressbar"
                aria-label="Corredores con check-in"
                aria-valuemin={0}
                aria-valuemax={registered}
                aria-valuenow={checkedIn}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-neo-on-dark-border"
              >
                <div
                  className="h-full rounded-full bg-neo-accent"
                  style={{
                    width: `${registered ? Math.min(100, (checkedIn / registered) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="m-0 mt-1 text-xs text-neo-on-dark-secondary">
                de {registered} inscritos no cancelados
              </p>
            </div>
            {secondary.map(([label, value]) => (
              <div key={label} className="flex flex-col justify-end gap-1 bg-neo-surface p-4">
                <p className="m-0 text-[28px] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                  {value ?? '—'}
                </p>
                <p className="m-0 text-xs text-neo-text-secondary">{label}</p>
              </div>
            ))}
          </div>

          <section aria-labelledby="active-dynamics" className="flex flex-col gap-2">
            <h2 id="active-dynamics" className="m-0 text-base font-bold">
              Dinámicas activas
            </h2>
            {active.length ? (
              <ul className="m-0 list-none overflow-hidden rounded-card border border-neo-border bg-neo-surface p-0">
                {active.map((row) => (
                  <li key={row.id} className="border-b border-neo-border last:border-b-0">
                    <button
                      type="button"
                      onClick={() => navigate('dynamics')}
                      className="grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-0 bg-transparent px-4 py-3 text-left text-neo-text"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[15px] font-bold">{row.name}</span>
                        <span className="text-xs text-neo-text-secondary">
                          {dynamicTypes[row.type]} · {row.participations_count ?? 0} participaciones
                        </span>
                      </span>
                      <StatusBadge status={row.status} label={dynamicStates[row.status]} />
                      <ChevronRight aria-hidden className="size-5 shrink-0 text-neo-accent-text" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-neo-text-secondary">
                No hay dinámicas activas. Actívalas desde Dinámicas.
              </p>
            )}
          </section>
        </>
      )}
    </section>
  )
}
