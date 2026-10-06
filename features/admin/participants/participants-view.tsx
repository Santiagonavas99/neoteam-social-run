'use client'

import { Trash2, UserCheck, Users } from 'lucide-react'
import { useState } from 'react'
import { callAdmin } from '../api'
import { matchesQuery } from '../filter'
import { participantStates } from '../labels'
import type { Participant } from '../types'
import { Feedback, StatusBadge } from '../ui/admin-ui'
import { ConfirmPanel } from '../ui/confirm-panel'
import { EmptyState, NoMatches } from '../ui/empty-state'
import { LabelOptions } from '../ui/label-options'
import { ListToolbar } from '../ui/list-toolbar'
import { LoadingState } from '../ui/loading-state'
import { useRecords } from '../use-records'

const fullName = (row: Participant) => `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim()

export function ParticipantsView({ token }: { token: string }) {
  const records = useRecords<Participant>('participants', token)
  const { rows, loading, busy, feedback, confirmation } = records
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')

  async function changeAttendance(row: Participant, next: string) {
    records.setBusy(row.id)
    records.setFeedback(null)
    try {
      await callAdmin('adminData', {
        token,
        resource: 'participants',
        operation: 'save',
        values: { id: row.id, status: next },
      })
      records.setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, status: next } : item)),
      )
      records.setFeedback({
        kind: 'success',
        text: `${row.first_name}: ${participantStates[next]}.`,
      })
    } catch (error) {
      records.onError(error)
    } finally {
      records.setBusy(null)
    }
  }

  const visible = rows.filter(
    (row) =>
      matchesQuery(
        [
          row.first_name,
          row.last_name,
          row.email,
          row.phone,
          row.document_number,
          row.registration_code,
          row.running_groups?.name,
          row.other_running_group,
        ],
        query,
      ) &&
      (!status || row.status === status),
  )

  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.status ?? 'registered'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const chips = [
    ['', `Todos ${rows.length}`],
    ...Object.entries(participantStates).map(([id, label]) => [id, `${label} ${counts[id] ?? 0}`]),
  ]

  return (
    <section className="management-view" aria-busy={loading}>
      <ListToolbar
        searchLabel="Buscar participantes"
        placeholder="Nombre, código, contacto…"
        query={query}
        onQuery={setQuery}
        loading={loading}
        refreshDisabled={loading || !!busy}
        onRefresh={() => {
          records.setFeedback(null)
          void records.reload()
        }}
      />
      {!loading && rows.length > 0 && (
        <fieldset>
          <legend className="sr-only">Filtrar por estado</legend>
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {chips.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={status === id}
                onClick={() => setStatus(id ?? '')}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 ${
                  status === id
                    ? 'border-neo-text bg-neo-text text-neo-bg'
                    : 'border-neo-border bg-neo-surface text-neo-text-secondary'
                }`}
              >
                <span className="whitespace-nowrap text-xs font-bold">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <Feedback value={feedback} />
      {confirmation && (
        <ConfirmPanel
          kind="delete"
          title={`¿Eliminar ${fullName(confirmation.row)}?`}
          text="Se eliminará permanentemente este participante de la base de datos, junto con sus participaciones en dinámicas y entradas de rifas asociadas. Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          busy={!!busy}
          onCancel={() => records.setConfirmation(null)}
          onConfirm={() => void records.confirm()}
        />
      )}
      {loading ? (
        <LoadingState>Cargando registros…</LoadingState>
      ) : !visible.length ? (
        query || status ? (
          <NoMatches
            onClear={() => {
              setQuery('')
              setStatus('')
            }}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="La salida empieza aquí"
            text="Cuando lleguen las inscripciones, podrás encontrarlas y registrar su check-in aquí."
          />
        )
      ) : (
        <>
          <p className="m-0 mb-2 text-xs text-neo-text-secondary">
            {visible.length} de {rows.length} participantes
          </p>
          <ul className="m-0 list-none overflow-hidden rounded-card border border-neo-border bg-neo-surface p-0">
            {visible.map((row) => {
              const state = row.status ?? 'registered'
              const name = fullName(row)
              return (
                <li key={row.id} className="border-b border-neo-border last:border-b-0">
                  <details className="group">
                    <summary className="grid min-h-16 cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="truncate text-[15px] font-bold text-neo-text">{name}</span>
                      <span className="row-span-2">
                        <StatusBadge status={state} label={participantStates[state] ?? state} />
                      </span>
                      <span className="truncate text-xs text-neo-text-secondary">
                        <span className="font-mono">
                          {row.registration_code || `#${row.registration_number}`}
                        </span>
                        {' · '}
                        {row.running_groups?.name || row.other_running_group || 'Independiente'}
                      </span>
                    </summary>
                    <div className="grid gap-4 border-t border-neo-border bg-neo-bg px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                        <dt className="text-neo-text-secondary">Documento</dt>
                        <dd className="m-0 text-neo-text">
                          {row.document_type} {row.document_number}
                        </dd>
                        <dt className="text-neo-text-secondary">Correo</dt>
                        <dd className="m-0 break-all text-neo-text">{row.email}</dd>
                        <dt className="text-neo-text-secondary">Celular</dt>
                        <dd className="m-0 text-neo-text">{row.phone}</dd>
                        <dt className="text-neo-text-secondary">Talla</dt>
                        <dd className="m-0 text-neo-text">{row.shirt_size || '—'}</dd>
                      </dl>
                      <div className="flex flex-wrap items-center gap-3">
                        {state === 'registered' && (
                          <button
                            type="button"
                            className="button button-small"
                            onClick={() => void changeAttendance(row, 'checked_in')}
                            disabled={!!busy}
                          >
                            <UserCheck aria-hidden className="size-4 shrink-0" />
                            {busy === row.id ? 'Guardando…' : 'Check-in'}
                          </button>
                        )}
                        <select
                          aria-label={`Estado de ${name}`}
                          value={state}
                          onChange={(e) => void changeAttendance(row, e.target.value)}
                          disabled={!!busy}
                          className="min-h-11 w-auto!"
                        >
                          <LabelOptions labels={participantStates} />
                        </select>
                        <button
                          type="button"
                          className="text-link danger-text"
                          onClick={() => records.setConfirmation({ row, action: 'delete' })}
                          disabled={!!busy}
                        >
                          <Trash2 aria-hidden className="size-4 shrink-0" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </details>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
