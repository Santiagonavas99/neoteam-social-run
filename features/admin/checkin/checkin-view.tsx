'use client'

import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  LoaderCircle,
  type LucideIcon,
} from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { formatTime } from '@/features/event/datetime'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { CheckinParticipant, CheckinResult } from '../types'
import { QrScanner } from '../ui/qr-scanner'

type Outcome =
  | { kind: CheckinResult; participant: CheckinParticipant }
  | { kind: 'error'; message: string }

const tone: Record<Outcome['kind'], { icon: LucideIcon; className: string }> = {
  checkedIn: { icon: CircleCheck, className: 'bg-neo-success-bg text-neo-accent-dark' },
  alreadyCheckedIn: { icon: Clock, className: 'bg-neo-surface text-neo-text' },
  cancelled: { icon: CircleX, className: 'bg-neo-danger-bg text-neo-danger' },
  error: { icon: CircleAlert, className: 'bg-neo-danger-bg text-neo-danger' },
}

function headline(outcome: Outcome) {
  if (outcome.kind === 'error') return outcome.message
  if (outcome.kind === 'checkedIn') return 'Check-in listo'
  if (outcome.kind === 'cancelled') return 'Inscripción cancelada'
  const at = outcome.participant.checkedInAt
  return at ? `Ya hizo check-in a las ${formatTime(at)}` : 'Ya hizo check-in'
}

function ResultCard({ outcome }: { outcome: Outcome }) {
  const { icon: Icon, className } = tone[outcome.kind]
  const participant = outcome.kind === 'error' ? null : outcome.participant
  return (
    <div className={`flex items-start gap-3 rounded-card p-4 ${className}`}>
      <Icon aria-hidden className="mt-1 size-6 shrink-0" />
      <div className="min-w-0">
        <p className="m-0 text-base font-bold">{headline(outcome)}</p>
        {participant ? (
          <>
            <p className="m-0 text-2xl font-bold break-words text-neo-text">
              {participant.firstName} {participant.lastName}
            </p>
            <p className="m-0 text-sm text-neo-text-secondary">
              {participant.code} · {participant.group}
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}

export function CheckinView({ token }: { token: string }) {
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  async function checkIn(code: string) {
    if (busyRef.current || !code.trim()) return false
    busyRef.current = true
    setBusy(true)
    try {
      const data = await callAdmin('checkin', { token, code })
      if (!data.result || !data.participant) throw new Error('No pudimos registrar el check-in.')
      setOutcome({ kind: data.result, participant: data.participant })
      if (data.result === 'checkedIn') navigator.vibrate?.(80)
      return true
    } catch (error) {
      setOutcome({ kind: 'error', message: errorMessage(error) })
      return false
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const code = new FormData(form).get('code')
    if (typeof code === 'string' && (await checkIn(code))) form.reset()
  }

  return (
    <section className="mx-auto flex w-full max-w-120 flex-col gap-4">
      <QrScanner onScan={(text) => void checkIn(text)} />
      <div aria-live="polite" className="min-h-24">
        {busy ? (
          <p className="m-0 flex items-center gap-2 p-4 text-sm text-neo-text-secondary">
            <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
            Registrando…
          </p>
        ) : outcome ? (
          <ResultCard outcome={outcome} />
        ) : (
          <p className="m-0 p-4 text-sm text-neo-text-secondary">
            Apunta la cámara al QR del corredor.
          </p>
        )}
      </div>
      <form onSubmit={submitManual} className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="checkin-code">Código manual</label>
          <input
            id="checkin-code"
            name="code"
            placeholder="SR26-00042"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 shrink-0 items-center rounded-control border border-neo-black bg-neo-black px-5 text-neo-white hover:border-neo-accent-dark hover:bg-neo-accent-dark"
        >
          <span className="text-[13px] font-bold">Registrar</span>
        </button>
      </form>
    </section>
  )
}
