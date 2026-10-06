'use client'

import { ChevronRight, Flag, Gift, Tag, UserCheck, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import { type AdminSection, adminSections } from '../sections'
import type { FeedbackValue, Metrics } from '../types'
import { Feedback } from '../ui/admin-ui'
import { LoadingState } from '../ui/loading-state'
import { RefreshButton } from '../ui/refresh-button'
import { useAdminData } from '../ui/use-admin-data'

export function OverviewView({
  token,
  navigate,
}: {
  token: string
  navigate: (section: AdminSection) => void
}) {
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const onError = useCallback(
    (error: unknown) => setFeedback({ kind: 'error', text: errorMessage(error) }),
    [],
  )
  const load = useCallback(
    async () =>
      (await callAdmin('adminData', { token, resource: 'metrics', operation: 'list' })).metrics ??
      null,
    [token],
  )
  const { data: metrics, loading, reload } = useAdminData<Metrics | null>(load, null, onError)

  const cards = [
    ['Inscritos', metrics?.registered, 'Registros no cancelados', Users],
    ['Check-in', metrics?.checkedIn, 'Asistencia confirmada', UserCheck],
    ['Grupos', metrics?.groups, 'Representados en registros', Flag],
    ['Marcas', metrics?.brands, 'Aliados activos', Tag],
    ['Rifas', metrics?.raffles, 'Premios configurados', Gift],
  ] as const

  return (
    <section className="management-view" aria-busy={loading}>
      <div className="section-toolbar">
        <p className="muted">Resumen del evento</p>
        <div className="toolbar-actions">
          <RefreshButton
            loading={loading}
            disabled={loading}
            onClick={() => {
              setFeedback(null)
              void reload()
            }}
          />
        </div>
      </div>
      <Feedback value={feedback} />
      {loading ? (
        <LoadingState>Cargando resumen…</LoadingState>
      ) : (
        <>
          <div className="metric-grid">
            {cards.map(([label, value, detail, Icon]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value ?? '—'}</strong>
                <small>{detail}</small>
                <Icon aria-hidden className="metric-index size-5" />
              </article>
            ))}
          </div>
          <section className="quick-access">
            <p className="section-label">EN MARCHA</p>
            <h2>Gestiona el encuentro</h2>
            <div>
              {adminSections.map(({ id, label, quickAccess, icon: Icon }) =>
                quickAccess ? (
                  <button type="button" key={id} onClick={() => navigate(id)}>
                    <span>
                      <strong className="flex items-center gap-2">
                        <Icon aria-hidden className="size-5 shrink-0" />
                        {label}
                      </strong>
                      <small>{quickAccess}</small>
                    </span>
                    <ChevronRight aria-hidden className="size-6 shrink-0 text-neo-accent-dark" />
                  </button>
                ) : null,
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}
