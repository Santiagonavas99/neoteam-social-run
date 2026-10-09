'use client'

import { FileDown, ListFilter, Mail, Pencil, Trash2, UserCheck, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { ParticipantProfile } from '@/lib/participant-profile'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import { genderLabels, participantStates } from '../labels'
import type {
  FeedbackValue,
  Participant,
  ParticipantGroupOption,
  ParticipantStatusCounts,
} from '../types'
import { Feedback, StatusBadge } from '../ui/admin-ui'
import { ConfirmPanel } from '../ui/confirm-panel'
import { EmptyState, NoMatches } from '../ui/empty-state'
import { LabelOptions } from '../ui/label-options'
import { ListToolbar } from '../ui/list-toolbar'
import { LoadingState } from '../ui/loading-state'
import { useAdminData } from '../ui/use-admin-data'
import { backupListCsv, backupListFileName } from './backup-list'
import { pageCorrection } from './pagination'
import { ParticipantEditor } from './participant-editor'

const EMPTY_COUNTS: ParticipantStatusCounts = {
  registered: 0,
  checked_in: 0,
  no_show: 0,
  cancelled: 0,
}

type ParticipantPage = {
  rows: Participant[]
  count: number
  page: number
  requestedPage: number
  pageSize: number
  statusCounts: ParticipantStatusCounts
}

const EMPTY_PAGE: ParticipantPage = {
  rows: [],
  count: 0,
  page: 1,
  requestedPage: 1,
  pageSize: 25,
  statusCounts: EMPTY_COUNTS,
}

function downloadBackupList(rows: Participant[]) {
  const url = URL.createObjectURL(
    new Blob([backupListCsv(rows)], { type: 'text/csv;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = backupListFileName(new Date())
  link.click()
  URL.revokeObjectURL(url)
}

const fullName = (row: Participant) => `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim()

export function ParticipantsView() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('')
  const [crew, setCrew] = useState('')
  const [gender, setGender] = useState('')
  const [emailStatus, setEmailStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [groups, setGroups] = useState<ParticipantGroupOption[]>([])
  const [editing, setEditing] = useState<Participant | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [confirmation, setConfirmation] = useState<Participant | null>(null)
  const [downloading, setDownloading] = useState(false)

  const onError = useCallback(
    (error: unknown) =>
      setFeedback({
        kind: 'error',
        text: errorMessage(error),
      }),
    [],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let mounted = true
    callAdmin<ParticipantGroupOption>('adminData', {
      resource: 'groups',
      operation: 'list',
    })
      .then((response) => {
        if (mounted) setGroups(response.rows ?? [])
      })
      .catch((error: unknown) => {
        if (mounted) onError(error)
      })
    return () => {
      mounted = false
    }
  }, [onError])

  const load = useCallback(async (): Promise<ParticipantPage> => {
    const response = await callAdmin<Participant>('adminData', {
      resource: 'participants',
      operation: 'list',
      paginated: true,
      page,
      query: debouncedQuery,
      status,
      crew,
      gender,
      emailStatus,
      sort,
    })
    return {
      rows: response.rows ?? [],
      count: response.count ?? 0,
      page: response.page ?? page,
      requestedPage: page,
      pageSize: response.pageSize ?? 25,
      statusCounts: response.statusCounts ?? EMPTY_COUNTS,
    }
  }, [crew, debouncedQuery, emailStatus, gender, page, sort, status])

  const { data, loading, reload } = useAdminData(load, EMPTY_PAGE, onError)

  useEffect(() => {
    // A page click updates React state before the next request resolves.
    // Do not replace it with the page number from the previous response.
    const corrected = pageCorrection(page, data.requestedPage, data.page)
    if (corrected !== null) setPage(corrected)
  }, [data.page, data.requestedPage, page])

  function updateQuery(next: string) {
    setQuery(next)
    setPage(1)
    setEditing(null)
  }

  function updateStatus(next: string) {
    setStatus(next)
    setEditing(null)
    setPage(1)
  }

  async function saveProfile(profile: ParticipantProfile) {
    if (!editing?.updated_at) return
    setBusy(`edit-${editing.id}`)
    setFeedback(null)
    try {
      const response = await callAdmin('updateParticipantProfile', {
        participantId: editing.id,
        updatedAt: editing.updated_at,
        profile,
      })
      setEditing(null)
      setFeedback({
        kind: 'success',
        text: response.unchanged
          ? 'No había cambios por guardar.'
          : response.emailChanged
            ? 'Datos guardados. El pase está pendiente para el correo corregido.'
            : 'Datos del participante actualizados.',
      })
      await reload()
    } catch (error) {
      onError(error)
    } finally {
      setBusy(null)
    }
  }

  function clearFilters() {
    setQuery('')
    setDebouncedQuery('')
    setStatus('')
    setCrew('')
    setGender('')
    setEmailStatus('')
    setSort('newest')
    setPage(1)
    setEditing(null)
  }

  async function changeAttendance(row: Participant, next: string) {
    setBusy(row.id)
    setFeedback(null)
    try {
      await callAdmin('adminData', {
        resource: 'participants',
        operation: 'save',
        values: { id: row.id, status: next },
      })
      setFeedback({
        kind: 'success',
        text: `${row.first_name}: ${participantStates[next]}.`,
      })
      await reload()
    } catch (error) {
      onError(error)
    } finally {
      setBusy(null)
    }
  }

  async function resendPass(row: Participant) {
    setBusy(`mail-${row.id}`)
    setFeedback(null)
    try {
      await callAdmin('resendPass', { participantId: row.id })
      setFeedback({ kind: 'success', text: `Pase enviado a ${row.email}.` })
    } catch (error) {
      onError(error)
    } finally {
      setBusy(null)
    }
  }

  async function confirmDelete() {
    if (!confirmation) return
    setBusy(confirmation.id)
    setFeedback(null)
    try {
      await callAdmin('adminData', {
        resource: 'participants',
        operation: 'delete',
        id: confirmation.id,
      })
      setFeedback({ kind: 'success', text: 'Registro eliminado.' })
      setConfirmation(null)
      await reload()
    } catch (error) {
      onError(error)
    } finally {
      setBusy(null)
    }
  }

  async function downloadAllParticipants() {
    setDownloading(true)
    setFeedback(null)
    try {
      const response = await callAdmin<Participant>('adminData', {
        resource: 'participants',
        operation: 'backup',
      })
      downloadBackupList(response.rows ?? [])
    } catch (error) {
      onError(error)
    } finally {
      setDownloading(false)
    }
  }

  const totalParticipants = Object.values(data.statusCounts).reduce(
    (total, count) => total + count,
    0,
  )
  const chips = [
    ['', `Todos ${totalParticipants}`],
    ...Object.entries(participantStates).map(([id, label]) => [
      id,
      `${label} ${data.statusCounts[id as keyof ParticipantStatusCounts] ?? 0}`,
    ]),
  ]

  const pageCount = Math.max(1, Math.ceil(data.count / data.pageSize))
  const rangeStart = data.count ? (data.page - 1) * data.pageSize + 1 : 0
  const rangeEnd = data.count ? Math.min(rangeStart + data.rows.length - 1, data.count) : 0

  return (
    <section aria-busy={loading}>
      <ListToolbar
        searchLabel="Buscar participantes"
        placeholder="Nombre, código, contacto…"
        query={query}
        onQuery={updateQuery}
        loading={loading}
        refreshDisabled={loading || !!busy || downloading}
        onRefresh={() => {
          setFeedback(null)
          void reload()
        }}
        action={
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void downloadAllParticipants()}
            disabled={loading || downloading || totalParticipants === 0}
          >
            <FileDown aria-hidden className="size-4 shrink-0" />
            {downloading ? 'Preparando lista…' : 'Descargar lista'}
          </button>
        }
      />
      {!loading && totalParticipants > 0 && (
        <fieldset>
          <legend className="sr-only">Filtrar por estado</legend>
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {chips.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={status === id}
                onClick={() => updateStatus(id ?? '')}
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
      <div className="mb-4 rounded-card border border-neo-border bg-neo-surface p-3 md:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-neo-text-secondary">
            <ListFilter aria-hidden className="size-4" /> Filtrar y ordenar
          </p>
          <button
            type="button"
            className="min-h-11 border-0 bg-transparent px-2 text-xs font-bold text-neo-accent-text"
            disabled={loading || !!busy}
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-bold text-neo-text-secondary">
            Running crew
            <select
              className="min-h-11 w-full"
              value={crew}
              disabled={!!busy}
              onChange={(event) => {
                setCrew(event.currentTarget.value)
                setEditing(null)
                setPage(1)
              }}
            >
              <option value="">Todos los crews</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
              <option value="custom">Otros crews</option>
              <option value="unassigned">Sin crew asignado</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-neo-text-secondary">
            Género
            <select
              className="min-h-11 w-full"
              value={gender}
              disabled={!!busy}
              onChange={(event) => {
                setGender(event.currentTarget.value)
                setEditing(null)
                setPage(1)
              }}
            >
              <option value="">Todos</option>
              <option value="female">Mujeres</option>
              <option value="male">Hombres</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-neo-text-secondary">
            Correo del pase
            <select
              className="min-h-11 w-full"
              value={emailStatus}
              disabled={!!busy}
              onChange={(event) => {
                setEmailStatus(event.currentTarget.value)
                setEditing(null)
                setPage(1)
              }}
            >
              <option value="">Todos los correos</option>
              <option value="sent">Envío registrado</option>
              <option value="pending">Pendiente de envío</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-neo-text-secondary">
            Ordenar
            <select
              className="min-h-11 w-full"
              value={sort}
              disabled={!!busy}
              onChange={(event) => {
                setSort(event.currentTarget.value)
                setEditing(null)
                setPage(1)
              }}
            >
              <option value="newest">Más recientes primero</option>
              <option value="oldest">Más antiguos primero</option>
              <option value="name">Apellidos A–Z</option>
            </select>
          </label>
        </div>
      </div>
      <Feedback value={feedback} />
      {confirmation && (
        <ConfirmPanel
          kind="delete"
          title={`¿Eliminar ${fullName(confirmation)}?`}
          text="Se eliminará permanentemente este participante de la base de datos, junto con sus participaciones en dinámicas y entradas de rifas asociadas. Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          busy={!!busy}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
      {loading ? (
        <LoadingState>Cargando registros…</LoadingState>
      ) : !data.rows.length ? (
        debouncedQuery || status || crew || gender || emailStatus ? (
          <NoMatches
            onClear={() => {
              clearFilters()
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
            Mostrando {rangeStart}–{rangeEnd} de {data.count} participantes
          </p>
          <ul className="m-0 list-none overflow-hidden rounded-card border border-neo-border bg-neo-surface p-0">
            {data.rows.map((row) => {
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
                      <span className="col-span-2 truncate text-xs text-neo-text-secondary md:hidden">
                        {row.email}
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
                        <dt className="text-neo-text-secondary">Nacimiento</dt>
                        <dd className="m-0 text-neo-text">{row.birth_date || '—'}</dd>
                        <dt className="text-neo-text-secondary">Contacto emergencia</dt>
                        <dd className="m-0 text-neo-text">
                          {row.emergency_name || '—'} · {row.emergency_phone || '—'}
                        </dd>
                        <dt className="text-neo-text-secondary">Pase por correo</dt>
                        <dd className="m-0 text-neo-text">
                          {row.pass_emailed_at ? 'Envío registrado' : 'Pendiente'}
                        </dd>
                        <dt className="text-neo-text-secondary">Género</dt>
                        <dd className="m-0 text-neo-text">
                          {(row.gender && genderLabels[row.gender]) || '—'}
                        </dd>
                      </dl>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className="button button-small button-secondary"
                          onClick={() =>
                            setEditing((previous) => (previous?.id === row.id ? null : row))
                          }
                          disabled={!!busy}
                        >
                          <Pencil aria-hidden className="size-4 shrink-0" />
                          {editing?.id === row.id ? 'Cerrar edición' : 'Editar datos'}
                        </button>
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
                        {state !== 'cancelled' && (
                          <button
                            type="button"
                            className="button button-small button-secondary"
                            onClick={() => void resendPass(row)}
                            disabled={!!busy}
                          >
                            <Mail aria-hidden className="size-4 shrink-0" />
                            {busy === `mail-${row.id}` ? 'Enviando…' : 'Reenviar pase'}
                          </button>
                        )}
                        <select
                          aria-label={`Estado de ${name}`}
                          value={state}
                          onChange={(event) => void changeAttendance(row, event.target.value)}
                          disabled={!!busy}
                          className="min-h-11 w-auto!"
                        >
                          <LabelOptions labels={participantStates} />
                        </select>
                        <button
                          type="button"
                          className="text-link danger-text"
                          onClick={() => setConfirmation(row)}
                          disabled={!!busy}
                        >
                          <Trash2 aria-hidden className="size-4 shrink-0" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {editing?.id === row.id && (
                      <ParticipantEditor
                        key={row.id}
                        participant={row}
                        groups={groups}
                        saving={!!busy}
                        onSave={saveProfile}
                        onCancel={() => setEditing(null)}
                      />
                    )}
                  </details>
                </li>
              )
            })}
          </ul>

          {pageCount > 1 && (
            <nav
              aria-label="Paginación de participantes"
              className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3"
            >
              <button
                type="button"
                className="button button-secondary min-h-11 justify-self-start"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={loading || data.page <= 1}
              >
                Anterior
              </button>
              <span className="text-center text-xs font-bold text-neo-text-secondary">
                Página {data.page} de {pageCount}
              </span>
              <button
                type="button"
                className="button button-secondary min-h-11 justify-self-end"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={loading || data.page >= pageCount}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
