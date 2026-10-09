'use client'

import { Clock3, QrCode } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cardClass, linkClass } from './form-ui'
import { RegistrationForm } from './registration-form'
import {
  isRegistrationClosed,
  REGISTRATION_CLOSED_MESSAGE,
  REGISTRATION_DEADLINE_LABEL,
} from './registration-deadline'

export function RegistrationAvailability({ initiallyClosed }: { initiallyClosed: boolean }) {
  const [closed, setClosed] = useState(initiallyClosed)

  useEffect(() => {
    const update = () => setClosed(isRegistrationClosed())
    update()
    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [])

  if (closed) {
    return (
      <section className={cardClass} aria-labelledby="registration-closed-title">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-neo-accent-text">
          INSCRIPCIONES CERRADAS
        </p>
        <h2 id="registration-closed-title" className="mt-0 text-2xl font-bold">
          El plazo de inscripción terminó.
        </h2>
        <p className="mb-5 text-neo-text-secondary">{REGISTRATION_CLOSED_MESSAGE}</p>
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
        Cierre de inscripciones: {REGISTRATION_DEADLINE_LABEL}
      </p>
      <RegistrationForm />
    </div>
  )
}
