'use client'

import { ArrowRight, Clock3 } from 'lucide-react'
import Link from 'next/link'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import {
  type LandingRegistrationState,
  landingRegistrationState,
} from './landing-registration-state'
import { type RegistrationSettings, registrationDeadlineCompactLabel } from './registration-deadline'

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
      <div className="v2-registration-feedback" role="status">
        <span className="v2-registration-feedback-indicator" aria-hidden="true" />
        <span className="v2-registration-feedback-label">Consultando inscripciones</span>
      </div>
    )
  }

  if (state === 'closed') {
    return (
      <div className="v2-registration-feedback v2-registration-feedback-closed" role="status">
        <Clock3 aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="v2-registration-feedback-label">Inscripciones cerradas</span>
        <span className="v2-registration-feedback-detail">Tu pase sigue disponible</span>
      </div>
    )
  }

  return (
    <div className="v2-registration-feedback v2-registration-feedback-open" role="status">
      <span className="v2-registration-feedback-indicator" aria-hidden="true" />
      <span className="v2-registration-feedback-label">Inscripciones abiertas</span>
      {settings?.deadline && (
        <span className="v2-registration-feedback-detail">
          Cierre · {registrationDeadlineCompactLabel(settings.deadline)} (COL)
        </span>
      )}
    </div>
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
      <span className={`button ${compact ? 'button-small' : ''} cursor-not-allowed opacity-60`}>
        {state === 'closed'
          ? compact
            ? 'Cerradas'
            : 'Inscripciones cerradas'
          : 'Registro no disponible'}
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
      {state === 'open'
        ? 'Registro'
        : state === 'closed'
          ? 'Inscripciones cerradas'
          : 'Consultar registro'}
    </Link>
  )
}
