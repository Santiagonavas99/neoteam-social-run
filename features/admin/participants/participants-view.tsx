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

  return (
    <section className="management-view" aria-busy={loading}>
      <ListToolbar
        searchLabel="Buscar participantes"
        placeholder="Nombre, código, contacto…"
        query={query}
        onQuery={setQuery}
        filters={
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              <LabelOptions labels={participantStates} />
            </select>
          </label>
        }
        loading={loading}
        refreshDisabled={loading || !!busy}
        onRefresh={() => {
          records.setFeedback(null)
          void records.reload()
        }}
      />
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
          <p className="result-count">
            {visible.length} de {rows.length} participantes
          </p>
          <div className="participants-table">
            <table>
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Código</th>
                  <th>Contacto</th>
                  <th>Grupo</th>
                  <th>Talla</th>
                  <th>Estado</th>
                  <th>Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Participante">
                      <strong>
                        {row.first_name} {row.last_name}
                      </strong>
                      <small>
                        {row.document_type} {row.document_number}
                      </small>
                    </td>
                    <td data-label="Código" className="mono-value">
                      {row.registration_code || `#${row.registration_number}`}
                    </td>
                    <td data-label="Contacto">
                      <span>{row.email}</span>
                      <small>{row.phone}</small>
                    </td>
                    <td data-label="Grupo">
                      {row.running_groups?.name || row.other_running_group || 'Independiente'}
                    </td>
                    <td data-label="Talla">{row.shirt_size || '—'}</td>
                    <td data-label="Estado">
                      <StatusBadge
                        status={row.status ?? 'registered'}
                        label={
                          participantStates[row.status ?? 'registered'] ?? row.status ?? 'Inscrito'
                        }
                      />
                    </td>
                    <td data-label="Asistencia">
                      <div className="attendance-actions">
                        {row.status === 'registered' && (
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
                          aria-label={`Estado de ${row.first_name} ${row.last_name}`}
                          value={row.status}
                          onChange={(e) => void changeAttendance(row, e.target.value)}
                          disabled={!!busy}
                        >
                          <LabelOptions labels={participantStates} />
                        </select>
                        <button
                          type="button"
                          className="button button-small button-danger"
                          onClick={() => records.setConfirmation({ row, action: 'delete' })}
                          disabled={!!busy}
                        >
                          <Trash2 aria-hidden className="size-4 shrink-0" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
