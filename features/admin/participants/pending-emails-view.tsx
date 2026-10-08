'use client'

import { CircleAlert, CircleCheck, Mail, RefreshCw } from 'lucide-react'
import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Feedback } from '../ui/admin-ui'
import { LoadingState } from '../ui/loading-state'
import { useAdminData } from '../ui/use-admin-data'
import {
  batchRecipients,
  type EmailQueue,
  emailFailureLabel,
  type PendingEmail,
} from './email-queue'

const INITIAL: EmailQueue = { rows: [], pending: 0, sent: 0, failed: 0 }

const recipientName = (row: PendingEmail) => `${row.first_name} ${row.last_name}`.trim()

export function PendingEmailsView() {
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const onError = useCallback(
    (error: unknown) => setFeedback({ kind: 'error', text: errorMessage(error) }),
    [],
  )
  const load = useCallback(async (): Promise<EmailQueue> => {
    const response = await callAdmin<PendingEmail>('passEmailQueue', { operation: 'list' })
    return {
      rows: response.rows ?? [],
      pending: response.pending ?? 0,
      sent: response.sent ?? 0,
      failed: response.failed ?? 0,
    }
  }, [])

  const { data, loading, reload } = useAdminData(load, INITIAL, onError)
  const recipients = batchRecipients(data.rows)
  const blocked = loading || sending

  async function sendBatch() {
    if (blocked || !confirming || !recipients.length) return
    setConfirming(false)
    setSending(true)
    setFeedback(null)
    const selected = [...recipients]
    let sent = 0
    let skipped = 0
    let failed = 0
    let limitReached = false
    let requestError: unknown = null

    try {
      for (const [index, recipient] of selected.entries()) {
        setProgress({ current: index + 1, total: selected.length })
        try {
          const response = await callAdmin('passEmailQueue', {
            operation: 'send',
            participantId: recipient.id,
          })
          if (response.queueResult === 'sent') sent++
          else if (response.queueResult === 'skipped') skipped++
          else {
            failed++
            if (response.reason === 'rate_limited') {
              limitReached = true
              break
            }
          }
          // Keep consecutive Resend requests below its per-second rate limit.
          if (index < selected.length - 1) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, 700))
          }
        } catch (error) {
          requestError = error
          break
        }
      }
      await reload()
      if (limitReached) {
        setFeedback({
          kind: 'error',
          text: `Resend alcanzó su límite diario. ${sent} aceptados, ${failed} pendientes. Vuelve mañana para continuar.`,
        })
      } else if (requestError) {
        setFeedback({
          kind: 'error',
          text: `${sent} correos aceptados. El envío se detuvo: ${errorMessage(requestError)} Actualiza la bandeja antes de reintentar.`,
        })
      } else if (failed) {
        setFeedback({
          kind: 'error',
          text: `${sent} aceptados, ${failed} fallidos y ${skipped} ya procesados. Revisa las incidencias antes de repetir la tanda.`,
        })
      } else {
        setFeedback({
          kind: 'success',
          text: `${sent} correos aceptados por Resend. ${skipped ? `${skipped} ya procesados. ` : ''}La lista se actualizó.`,
        })
      }
    } finally {
      setSending(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <section aria-busy={blocked} className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-card bg-neo-black p-5 text-neo-white">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-neo-on-dark-secondary">
            Pases pendientes
          </p>
          <p className="m-0 mt-2 text-[44px] font-extrabold leading-none tabular-nums text-neo-accent">
            {loading ? '—' : data.pending}
          </p>
          <p className="m-0 mt-2 text-xs text-neo-on-dark-secondary">
            Inscripciones activas sin correo aceptado
          </p>
        </div>
        <div className="rounded-card border border-neo-border bg-neo-surface p-5">
          <p className="m-0 flex items-center gap-2 text-xs font-bold text-neo-text-secondary">
            <CircleCheck aria-hidden className="size-4" /> Aceptados por Resend
          </p>
          <p className="m-0 mt-3 text-[34px] font-extrabold leading-none tabular-nums">
            {loading ? '—' : data.sent}
          </p>
        </div>
        <div className="rounded-card border border-neo-border bg-neo-surface p-5">
          <p className="m-0 flex items-center gap-2 text-xs font-bold text-neo-text-secondary">
            <CircleAlert aria-hidden className="size-4" /> Con último intento fallido
          </p>
          <p className="m-0 mt-3 text-[34px] font-extrabold leading-none tabular-nums">
            {loading ? '—' : data.failed}
          </p>
        </div>
      </div>

      <p className="m-0 rounded-control border border-neo-border bg-neo-muted-bg px-4 py-3 text-sm leading-6 text-neo-text-secondary">
        Resend comparte su cupo diario entre pases, códigos de acceso al panel y reenvíos. No se
        enviará ninguna tanda automáticamente. El botón procesa hasta 10 pases, uno por uno, y se
        detiene si Resend informa que se agotó el cupo.
      </p>

      <Feedback value={feedback} />
      {sending && (
        <p role="status" aria-live="polite" className="m-0 text-sm font-bold text-neo-accent-text">
          Enviando {progress.current} de {progress.total}…
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-extrabold">Cola de envío</h2>
          <p className="m-0 mt-1 text-xs text-neo-text-secondary">
            Primero los registros más antiguos · Hasta 25 visibles
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setFeedback(null)
              setConfirming(false)
              void reload()
            }}
            disabled={blocked}
            className="button button-secondary"
          >
            <RefreshCw aria-hidden className="size-4" /> Actualizar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={blocked || !recipients.length || confirming}
            className="button"
          >
            <Mail aria-hidden className="size-4" />
            Enviar tanda ({recipients.length})
          </button>
        </div>
      </div>

      {confirming && (
        <section
          aria-label="Confirmar envío de correos"
          className="rounded-card border border-neo-accent-border bg-neo-accent-soft p-5"
        >
          <h3 className="m-0 text-base font-bold">¿Enviar {recipients.length} pases por correo?</h3>
          <p className="m-0 mt-2 text-sm leading-6">
            Se enviarán en orden de inscripción usando Resend. Si se alcanza la cuota diaria, los
            restantes seguirán pendientes para otra tanda.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
            <button type="button" className="button" onClick={() => void sendBatch()}>
              Confirmar envío
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <LoadingState>Consultando envíos pendientes…</LoadingState>
      ) : data.pending === 0 ? (
        <div className="rounded-card border border-neo-border bg-neo-surface p-8 text-center">
          <CircleCheck aria-hidden className="mx-auto size-8 text-neo-accent-text" />
          <h3 className="mt-3 mb-2 text-base font-bold">No hay pases pendientes</h3>
          <p className="m-0 text-sm text-neo-text-secondary">
            Todas las inscripciones activas tienen un envío aceptado por Resend.
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none divide-y divide-neo-border overflow-hidden rounded-card border border-neo-border bg-neo-surface p-0">
          {data.rows.map((row) => (
            <li
              key={row.id}
              className="flex min-w-0 flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold">{recipientName(row)}</p>
                <p className="m-0 mt-1 break-all text-sm text-neo-text-secondary">{row.email}</p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                <span className="text-xs font-bold text-neo-text-secondary">
                  Inscripción #{row.registration_number}
                </span>
                {row.pass_email_last_error && (
                  <span className="rounded-full bg-neo-warning-bg px-2.5 py-1 text-xs font-bold text-neo-warning">
                    {emailFailureLabel(row.pass_email_last_error)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {data.pending > data.rows.length && (
        <p className="m-0 text-xs text-neo-text-secondary">
          Quedan {data.pending - data.rows.length} registros adicionales; aparecerán al completar o
          actualizar las tandas.
        </p>
      )}
    </section>
  )
}
