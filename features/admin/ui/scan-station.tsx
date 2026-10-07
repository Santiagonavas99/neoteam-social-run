'use client'

import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Clock,
  LoaderCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../errors'
import type { ScannedParticipant } from '../types'
import { type QrCameraState, QrScanner } from './qr-scanner'
import { playScanFeedback, type ScanFeedback, unlockScanSound } from './scan-feedback'

const RESULT_DISPLAY_MS = 3200

export type ScanOutcome = {
  tone: 'success' | 'neutral' | 'warning' | 'danger'
  headline: string
  detail?: string
  icon?: LucideIcon
  participant?: ScannedParticipant
}

const feedbackFor: Record<ScanOutcome['tone'], ScanFeedback> = {
  success: 'success',
  neutral: 'success',
  warning: 'repeat',
  danger: 'error',
}

const outcomeIcons: Record<ScanOutcome['tone'], LucideIcon> = {
  success: CircleCheck,
  neutral: CircleCheck,
  warning: Clock,
  danger: CircleAlert,
}

function ScanFrame() {
  const corner = 'absolute size-8 border-neo-accent'
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 z-10 aspect-square w-[68%] max-w-72 -translate-x-1/2 -translate-y-1/2"
    >
      <span className={`${corner} top-0 left-0 rounded-tl-control border-t-4 border-l-4`} />
      <span className={`${corner} top-0 right-0 rounded-tr-control border-t-4 border-r-4`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-control border-b-4 border-l-4`} />
      <span className={`${corner} right-0 bottom-0 rounded-br-control border-r-4 border-b-4`} />
    </div>
  )
}

function OutcomeOverlay({ outcome }: { outcome: ScanOutcome }) {
  const Icon = outcome.icon ?? outcomeIcons[outcome.tone]
  const { participant } = outcome
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-neo-black/70 p-6 text-center text-neo-white">
      <div className="max-w-80">
        <Icon
          aria-hidden
          className={`mx-auto mb-3 size-10 ${
            outcome.tone === 'success' ? 'text-neo-accent' : 'text-neo-white'
          }`}
        />
        <p
          className={`m-0 font-bold ${
            outcome.tone === 'warning'
              ? 'text-xl tracking-[0.04em] uppercase'
              : 'text-xl tracking-[-0.02em]'
          }`}
        >
          {outcome.headline}
        </p>
        {outcome.detail ? <p className="m-0 mt-1 text-sm font-bold">{outcome.detail}</p> : null}
        {participant ? (
          <div className="mt-3">
            <p className="m-0 text-2xl font-bold tracking-[-0.03em]">
              {participant.firstName} {participant.lastName}
            </p>
            <p className="m-0 mt-1 text-sm text-neo-on-dark-secondary">
              {participant.code} · {participant.group}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ManualEntry({
  inputId,
  busy,
  onSubmit,
  onClose,
}: {
  inputId: string
  busy: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}) {
  return (
    <div className="rounded-card border border-neo-border bg-neo-surface p-4">
      <button
        type="button"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-neo-text"
        onClick={onClose}
      >
        <ArrowLeft aria-hidden className="size-4 shrink-0" />
        Volver al escáner
      </button>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label htmlFor={inputId} className="font-bold">
          Código del corredor
        </label>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            id={inputId}
            name="code"
            placeholder="SR26-00042"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            autoFocus
            className="min-h-12 text-base"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center justify-center rounded-control border border-neo-text bg-neo-text px-5 text-neo-surface hover:border-neo-accent-dark hover:bg-neo-accent-dark"
          >
            <span className="text-[13px] font-bold">{busy ? 'Registrando…' : 'Registrar'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export function ScanStation({
  inputId,
  onCode,
  title = 'Escanea el código QR',
  helper = 'Apunta la cámara al QR del pase del corredor.',
  busyLabel = 'Validando corredor…',
}: {
  inputId: string
  onCode: (code: string) => Promise<ScanOutcome>
  title?: string
  helper?: string
  busyLabel?: string
}) {
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [busy, setBusy] = useState(false)
  const [cameraState, setCameraState] = useState<QrCameraState>('starting')
  const [manualOpen, setManualOpen] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const busyRef = useRef(false)

  useEffect(() => {
    if (!outcome) return
    const timer = window.setTimeout(() => setOutcome(null), RESULT_DISPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [outcome])

  async function run(code: string) {
    if (busyRef.current || !code.trim()) return false
    busyRef.current = true
    setOutcome(null)
    setBusy(true)
    try {
      const next = await onCode(code)
      setOutcome(next)
      playScanFeedback(feedbackFor[next.tone])
      return true
    } catch (error) {
      setOutcome({ tone: 'danger', headline: errorMessage(error) })
      playScanFeedback('error')
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

  function retryCamera() {
    setOutcome(null)
    setCameraState('starting')
    setRetryToken((value) => value + 1)
  }

  return (
    <div className="flex flex-col gap-4" onPointerDown={unlockScanSound}>
      <header>
        <h2 className="m-0 text-2xl font-bold tracking-[-0.035em]">{title}</h2>
        <p className="m-0 mt-1 text-sm leading-relaxed text-neo-text-secondary">{helper}</p>
      </header>

      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card border border-neo-border bg-neo-black md:aspect-[4/3]">
        <QrScanner
          onScan={(text) => void run(text)}
          onStateChange={setCameraState}
          retryToken={retryToken}
        />

        {cameraState !== 'failed' && !busy && !outcome ? <ScanFrame /> : null}

        <div aria-live="polite">
          {cameraState === 'failed' ? (
            <div
              role="alert"
              className="absolute inset-0 z-30 grid place-items-center bg-neo-black p-6 text-center text-neo-white"
            >
              <div className="max-w-80">
                <CircleAlert aria-hidden className="mx-auto mb-3 size-10" />
                <p className="m-0 text-xl font-bold">No pudimos abrir la cámara</p>
                <p className="m-0 mt-2 text-sm leading-relaxed text-neo-on-dark-secondary">
                  Permite el acceso en el navegador o ingresa el código manualmente.
                </p>
                <button
                  type="button"
                  onClick={retryCamera}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-neo-white bg-neo-white px-4 text-sm font-bold text-neo-black"
                >
                  <RefreshCw aria-hidden className="size-4 shrink-0" />
                  Reintentar cámara
                </button>
              </div>
            </div>
          ) : busy ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-neo-black/70 p-6 text-center text-neo-white">
              <div>
                <LoaderCircle
                  aria-hidden
                  className="mx-auto mb-3 size-10 motion-safe:animate-spin"
                />
                <p className="m-0 text-lg font-bold">{busyLabel}</p>
                <p className="m-0 mt-1 text-sm text-neo-on-dark-secondary">
                  Mantén el pase frente a la cámara.
                </p>
              </div>
            </div>
          ) : outcome ? (
            <OutcomeOverlay outcome={outcome} />
          ) : cameraState === 'starting' ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-neo-black p-6 text-center text-neo-white">
              <div>
                <LoaderCircle
                  aria-hidden
                  className="mx-auto mb-3 size-10 motion-safe:animate-spin"
                />
                <p className="m-0 text-lg font-bold">Iniciando cámara…</p>
              </div>
            </div>
          ) : (
            <p className="absolute right-4 bottom-4 left-4 z-20 m-0 rounded-control bg-neo-black/70 px-3 py-2 text-center text-sm font-bold text-neo-white">
              Coloca el QR dentro del marco
            </p>
          )}
        </div>
      </div>

      {manualOpen ? (
        <ManualEntry
          inputId={inputId}
          busy={busy}
          onSubmit={(event) => void submitManual(event)}
          onClose={() => setManualOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-control px-4 text-sm font-bold text-neo-accent-text hover:bg-neo-muted-bg"
        >
          Ingresar código manualmente
        </button>
      )}
    </div>
  )
}
