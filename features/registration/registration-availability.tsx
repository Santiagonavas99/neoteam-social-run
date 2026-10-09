'use client'

import { Clock3, QrCode } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cardClass, linkClass } from './form-ui'
import {
  isRegistrationClosed,
  REGISTRATION_UNAVAILABLE_MESSAGE,
  registrationDeadlineLabel,
  type RegistrationSettings,
} from './registration-deadline'
import { RegistrationForm } from './registration-form'

export function RegistrationAvailability({
  initialSettings,
}: {
  initialSettings: RegistrationSettings | null
}) {
  const [settings, setSettings] = useState(initialSettings)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const response = await fetch('/api/registration-status', { cache: 'no-store' })
        if (!response.ok) return
        const next = (await response.json()) as RegistrationSettings
        if (active && typeof next.registrationOpen === 'boolean') setSettings(next)
      } catch {
        // Keep the last known state. New registrations are still checked by the database.
      }
    }
    void refresh()
    const statusTimer = window.setInterval(() => void refresh(), 15000)
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      active = false
      window.clearInterval(statusTimer)
      window.clearInterval(clockTimer)
    }
  }, [])

  if (!settings) {
    return (
      <section className={cardClass} aria-live="polite">
        <p className="m-0 text-neo-text-secondary">{REGISTRATION_UNAVAILABLE_MESSAGE}</p>
      </section>
    )
  }

  if (isRegistrationClosed(settings, now)) {
    return (
      <section className={cardClass} aria-labelledby="registration-closed-title">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-neo-accent-text">
          INSCRIPCIONES CERRADAS
        </p>
        <h2 id="registration-closed-title" className="mt-0 text-2xl font-bold">
          El plazo de inscripción terminó.
        </h2>
        <p className="mb-5 text-neo-text-secondary">
          {settings.registrationOpen && settings.deadline
            ? `Las inscripciones cerraron el ${registrationDeadlineLabel(settings.deadline)} (hora de Colombia).`
            : 'Las inscripciones se encuentran cerradas.'}
        </p>
        <p className="mb-4 text-neo-text-secondary">
          Si ya te registraste, puedes recuperar tu pase sin problemas.
        </p>
        <Link href="/pase" className={linkClass}>
          <QrCode aria-hidden className="size-4 shrink-0" />
          Recuperar mi pase
        </Link>
      </section>
    )
  }

  return (
    <div className="min-w-0">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-neo-accent-text">
        <Clock3 aria-hidden className="size-4 shrink-0" />
        {settings.deadline
          ? `Cierre de inscripciones: ${registrationDeadlineLabel(settings.deadline)} (Colombia)`
          : 'Inscripciones abiertas · sin fecha límite'}
      </p>
      <RegistrationForm />
    </div>
  )
}
