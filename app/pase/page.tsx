import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandLink } from '@/components/brand-link'
import { eventConfig } from '@/features/event/event'
import { ClaimForm } from '@/features/registration/claim-form'

export const metadata: Metadata = {
  title: 'Tu pase · Social Run NeoTeam',
  robots: { index: false },
}

export default function PassPage() {
  return (
    <main className="registration-page">
      <header className="registration-header shell">
        <BrandLink />
        <Link href="/" className="text-link">
          <ArrowLeft aria-hidden className="size-4 shrink-0" />
          Volver al evento
        </Link>
      </header>
      <div className="registration-layout shell">
        <aside className="registration-copy">
          <p className="kicker">SOCIAL RUN · {eventConfig.dateShort}</p>
          <h1>
            UN QR. <br />Y A CORRER.
          </h1>
          <p>
            Tu pase identifica tu inscripción y nos permite hacer el check-in rápido el día del
            evento.
          </p>
          <div className="registration-fact">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="size-3.5 shrink-0" />
              FECHA
            </span>
            <strong>{eventConfig.dateLabel}</strong>
          </div>
          <div className="registration-fact">
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden className="size-3.5 shrink-0" />
              PUNTO
            </span>
            <strong>{eventConfig.location}</strong>
          </div>
        </aside>
        <ClaimForm />
      </div>
    </main>
  )
}
