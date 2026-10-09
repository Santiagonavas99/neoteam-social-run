'use client'

import { ArrowRight, Clock3 } from 'lucide-react'
import Link from 'next/link'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import {
  registrationDeadlineLabel,
  type RegistrationSettings,
} from './registration-deadline'
import { landingRegistrationState, type LandingRegistrationState } from './landing-registration-state'

type StatusContextValue = {
  state: LandingRegistrationState
  settings: RegistrationSettings | null
}

const StatusContext = createContext<StatusContextValue>({
  state: 'unavailable',
  settings: null,
})

export function LandingRegistrationProvider({
  initialSettings,
  children,
}: {
  initialSettings: RegistrationSettings | null
  children: ReactNode
}) {
  const [settings, setSettings] = useState<RegistrationSettings | null>(initialSettings)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let active = true

    const refresh = async () => {
      try {
        const response = await fetch('/api/registration-status', { cache: 'no-store' })
        if (!response.ok) return
        const next = (await response.json()) as RegistrationSettings
        if (active && typeof next.registrationOpen === 'boolean') setSettings(next)
      } catch {
        // Preserve last known state; the database still enforces the actual registration cutoff.
      }
    }

    void refresh()
    const clock = window.setInterval(() => setNow(Date.now()), 1000)
    const poll = window.setInterval(() => void refresh(), 15_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      active = false
      window.clearInterval(clock)
      window.clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <StatusContext.Provider value={{ state: landingRegistrationState(settings, now), settings }}>
      {children}
    </StatusContext.Provider>
  )
}

function useLandingRegistration() {
  return useContext(StatusContext)
}

export function LandingRegistrationNotice() {
  const { state, settings } = useLandingRegistration()
  if (state === 'unavailable') {
    return (
      <p className="mb-3 text-sm text-neo-text-secondary" role="status">
        Consultando disponibilidad de inscripciones…
      </p>
    )
  }
  if (state === 'closed') {
    return (
      <div role="status" aria-live="polite" className="mb-4 max-w-md">
        <span className="inline-flex items-center gap-2 rounded-full border border-neo-border-strong bg-neo-muted-bg px-3 py-2 text-xs font-extrabold uppercase tracking-[0.07em] text-neo-text">
          <Clock3 aria-hidden className="size-4 shrink-0" />
          Inscripciones cerradas
        </span>
        <p className="mt-2 mb-0 text-sm text-neo-text-secondary">
          {settings?.registrationOpen
            ? 'El plazo de inscripción ha finalizado. Si ya te registraste, tu pase sigue disponible.'
            : 'El registro de participantes está cerrado. Si ya te registraste, consulta tu pase.'}
        </p>
      </div>
    )
  }
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-neo-accent-text" role="status">
      <Clock3 aria-hidden className="size-4 shrink-0" />
      {settings?.deadline
        ? `Inscripciones abiertas · hasta el ${registrationDeadlineLabel(settings.deadline)} (Colombia)`
        : 'Inscripciones abiertas'}
    </p>
  )
}

export function LandingRegistrationCta({
  label,
  compact = false,
}: {
  label: string
  compact?: boolean
}) {
  const { state } = useLandingRegistration()
  if (state !== 'open') {
    return (
      <span
        aria-label={state === 'closed' ? 'Inscripciones cerradas' : 'Inscripciones no disponibles'}
        className={`button ${compact ? 'button-small' : ''} cursor-not-allowed opacity-60`}
      >
        {state === 'closed' ? (compact ? 'Cerradas' : 'Inscripciones cerradas') : 'Registro no disponible'}
      </span>
    )
  }
  return (
    <Link href="/registro" className={`button ${compact ? 'button-small' : ''}`}>
      {label}
      {!compact && <ArrowRight aria-hidden className="size-4 shrink-0" />}
    </Link>
  )
}

export function LandingRegistrationFooterLink() {
  const { state } = useLandingRegistration()
  return (
    <Link href="/registro" className="text-link">
      {state === 'open' ? 'Registro' : state === 'closed' ? 'Inscripciones cerradas' : 'Consultar registro'}
    </Link>
  )
}
