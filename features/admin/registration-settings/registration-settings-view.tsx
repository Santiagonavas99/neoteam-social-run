'use client'

import { CalendarClock, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  colombiaInputToUtc,
  colombiaLocalInput,
  isRegistrationClosed,
  type RegistrationSettings,
  registrationDeadlineLabel,
} from '@/features/registration/registration-deadline'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Feedback } from '../ui/admin-ui'
import { LoadingState } from '../ui/loading-state'
import { RefreshButton } from '../ui/refresh-button'
import { useAdminData } from '../ui/use-admin-data'

const fallback: RegistrationSettings = { deadline: null, registrationOpen: false }

export function RegistrationSettingsView() {
  const [dateLocal, setDateLocal] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const onError = useCallback(
    (error: unknown) =>
      setFeedback({ kind: 'error', text: errorMessage(error, 'No pudimos cargar el plazo.') }),
    [],
  )
  const load = useCallback(async (): Promise<RegistrationSettings> => {
    const result = await callAdmin('getRegistrationSettings')
    return {
      deadline: result.deadline ?? null,
      registrationOpen: result.registrationOpen === true,
    }
  }, [])
  const { data, loading, reload } = useAdminData(load, fallback, onError)

  useEffect(() => {
    setDateLocal(data.deadline ? colombiaLocalInput(data.deadline) : '')
    setOpen(data.registrationOpen)
  }, [data.deadline, data.registrationOpen])

  const valid = !dateLocal || colombiaInputToUtc(dateLocal) !== null
  const changed =
    open !== data.registrationOpen ||
    (dateLocal ? colombiaInputToUtc(dateLocal) : null) !==
      (data.deadline ? new Date(data.deadline).toISOString() : null)

  async function save() {
    if (!valid || !changed) return
    setSaving(true)
    setFeedback(null)
    try {
      await callAdmin('saveRegistrationSettings', {
        deadlineLocal: dateLocal || null,
        registrationOpen: open,
      })
      await reload()
      setFeedback({
        kind: 'success',
        text: 'Plazo actualizado. El cambio ya aplica a nuevas inscripciones.',
      })
    } catch (error) {
      onError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-busy={loading || saving} className="flex max-w-3xl flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-extrabold tracking-tight">Plazo de inscripción</h2>
          <p className="m-0 mt-2 text-sm text-neo-text-secondary">
            Cambia el cierre del evento sin actualizar la web. Todos los horarios son de Colombia
            (UTC−5).
          </p>
        </div>
        <RefreshButton
          loading={loading}
          disabled={loading || saving}
          onClick={() => {
            setFeedback(null)
            void reload()
          }}
        />
      </div>

      <Feedback value={feedback} />

      {loading ? (
        <LoadingState>Cargando configuración del registro…</LoadingState>
      ) : (
        <div className="flex flex-col gap-5 rounded-card border border-neo-border bg-neo-surface p-5 sm:p-7">
          <div className="flex flex-col gap-4 border-b border-neo-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <CalendarClock aria-hidden className="mt-1 size-5 shrink-0 text-neo-accent-text" />
              <div>
                <p className="m-0 text-sm font-bold">
                  Estado actual: {isRegistrationClosed(data) ? 'Cerradas' : 'Abiertas'}
                </p>
                <p className="m-0 mt-1 text-sm text-neo-text-secondary">
                  {data.deadline
                    ? `Cierre actual: ${registrationDeadlineLabel(data.deadline)} (Colombia)`
                    : 'Sin cierre automático programado'}
                </p>
              </div>
            </div>
            <label className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-between gap-4 self-stretch rounded-control border border-neo-border bg-neo-muted-bg px-4 py-2 sm:self-center">
              <span className="flex flex-col">
                <span className="text-sm font-bold">Permitir inscripciones</span>
                <span className="text-xs text-neo-text-secondary">
                  {open ? 'Habilitadas' : 'Deshabilitadas'}
                </span>
              </span>
              <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
                <input
                  type="checkbox"
                  role="switch"
                  checked={open}
                  onChange={(event) => setOpen(event.target.checked)}
                  disabled={saving}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-neo-border-strong transition-colors peer-checked:bg-neo-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neo-accent-text"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"
                />
              </span>
            </label>
          </div>
          {changed && (
            <p className="m-0 text-xs font-medium text-neo-accent-text">
              Tienes cambios sin guardar. Pulsa «Guardar configuración» para aplicarlos.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="registration-deadline" className="text-sm font-semibold">
              Fecha y hora límite · Colombia
            </label>
            <input
              id="registration-deadline"
              type="datetime-local"
              value={dateLocal}
              onChange={(event) => setDateLocal(event.target.value)}
              aria-invalid={!valid}
              className="w-full"
            />
            <p className="m-0 text-xs text-neo-text-secondary">
              Al llegar esta hora se cierra automáticamente. Borra la fecha para no tener cierre
              automático.
            </p>
            {!valid && (
              <p role="alert" className="m-0 text-xs text-neo-danger">
                Selecciona una fecha y hora válidas.
              </p>
            )}
            {open &&
              dateLocal &&
              valid &&
              isRegistrationClosed({
                registrationOpen: true,
                deadline: colombiaInputToUtc(dateLocal),
              }) && (
                <p className="m-0 text-xs font-medium text-neo-danger">
                  Esta fecha ya pasó: al guardar, el registro quedará cerrado.
                </p>
              )}
          </div>

          <button
            type="button"
            className="button self-start"
            disabled={!changed || !valid || loading || saving}
            onClick={() => void save()}
          >
            <Save aria-hidden className="size-4 shrink-0" />
            {saving ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      )}
    </section>
  )
}
