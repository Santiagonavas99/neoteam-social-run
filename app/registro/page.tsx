import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { BrandLink } from '@/components/brand-link'
import { eventConfig } from '@/features/event/event'
import { RegistrationForm } from '@/features/registration/registration-form'

export default function RegistrationPage() {
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
            RESERVA
            <br />
            TU LUGAR.
          </h1>
          <p>
            El registro es gratuito y toma menos de dos minutos. Estos datos nos permitirán
            organizar asistentes, grupos invitados, check-in y rifas.
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
          <div className="registration-fact">
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden className="size-3.5 shrink-0" />
              FORMATO
            </span>
            <strong>Social Run · comunidad</strong>
          </div>
        </aside>
        <RegistrationForm />
      </div>
    </main>
  )
}
