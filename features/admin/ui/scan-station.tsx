'use client'

import { CircleAlert, CircleCheck, Clock, LoaderCircle, type LucideIcon } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { errorMessage } from '../errors'
import type { ScannedParticipant } from '../types'
import { QrScanner } from './qr-scanner'

export type ScanOutcome = {
  tone: 'success' | 'neutral' | 'danger'
  headline: string
  icon?: LucideIcon
  participant?: ScannedParticipant
}

const tones: Record<ScanOutcome['tone'], { icon: LucideIcon; className: string }> = {
  success: { icon: CircleCheck, className: 'bg-neo-success-bg text-neo-accent-text' },
  neutral: { icon: Clock, className: 'bg-neo-surface text-neo-text' },
  danger: { icon: CircleAlert, className: 'bg-neo-danger-bg text-neo-danger' },
}

function ResultCard({ outcome }: { outcome: ScanOutcome }) {
  const tone = tones[outcome.tone]
  const Icon = outcome.icon ?? tone.icon
  const { participant } = outcome
  return (
    <div className={`flex items-start gap-3 rounded-card p-4 ${tone.className}`}>
      <Icon aria-hidden className="mt-1 size-6 shrink-0" />
      <div className="min-w-0">
        <p className="m-0 text-base font-bold">{outcome.headline}</p>
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

// Camera plus manual code field; one request at a time, and the result stays until the next scan.
export function ScanStation({
  inputId,
  onCode,
}: {
  inputId: string
  onCode: (code: string) => Promise<ScanOutcome>
}) {
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  async function run(code: string) {
    if (busyRef.current || !code.trim()) return false
    busyRef.current = true
    setBusy(true)
    try {
      const next = await onCode(code)
      setOutcome(next)
      if (next.tone === 'success') navigator.vibrate?.(80)
      return true
    } catch (error) {
      setOutcome({ tone: 'danger', headline: errorMessage(error) })
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
    if (typeof code === 'string' && (await run(code))) form.reset()
  }

  return (
    <div className="flex flex-col gap-4">
      <QrScanner onScan={(text) => void run(text)} />
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
          <label htmlFor={inputId}>Código manual</label>
          <input
            id={inputId}
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
          className="inline-flex min-h-12 shrink-0 items-center rounded-control border border-neo-text bg-neo-text px-5 text-neo-surface hover:border-neo-accent-dark hover:bg-neo-accent-dark"
        >
          <span className="text-[13px] font-bold">Registrar</span>
        </button>
      </form>
    </div>
  )
}
