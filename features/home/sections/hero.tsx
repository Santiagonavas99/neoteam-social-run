import { ArrowDown, CalendarDays, Clock, MapPin, QrCode, Route } from 'lucide-react'
import Link from 'next/link'
import { eventConfig } from '@/features/event/event'
import { EventCountdown } from '@/features/event/event-countdown'
import { LandingRegistrationCta, LandingRegistrationNotice } from '@/features/registration/landing-registration-status'

export function Hero() {
  return (
    <>
      <section className="v2-hero">
        <div className="v2-hero-meta shell">
          <span className="v2-meta-pill accent gap-1.5">
            <CalendarDays aria-hidden className="size-3.5 shrink-0 max-sm:hidden" />
            18 OCT · 2026
          </span>
          <span className="v2-meta-pill gap-1.5">
            <Clock aria-hidden className="size-3.5 shrink-0 max-sm:hidden" />
            07:30 A. M.
          </span>
          <span className="v2-meta-pill gap-1.5">
            <Route aria-hidden className="size-3.5 shrink-0 max-sm:hidden" />
            5K SOCIAL
          </span>
        </div>

        <div className="v2-hero-grid shell">
          <div className="v2-hero-title">
            <p className="kicker">{eventConfig.eyebrow}</p>
            <h1>
              <span>SOCIAL</span>
              <span>RUN</span>
            </h1>
          </div>

          <div className="v2-hero-side">
            <p>{eventConfig.headline}</p>
            <EventCountdown
              startsAt={eventConfig.startsAt}
              endsAt={eventConfig.endsAt}
              initialNow={Date.now()}
            />
            <LandingRegistrationNotice />
            <div className="v2-hero-actions">
              <LandingRegistrationCta label="Quiero participar" />
              <Link href="/pase" className="text-link">
                Mi pase <QrCode aria-hidden className="size-4 shrink-0" />
              </Link>
              <a href="#agenda" className="text-link">
                Ver agenda <ArrowDown aria-hidden className="size-4 shrink-0" />
              </a>
            </div>
            <div className="v2-route-card v2-route-card-desktop">
              <strong>5K</strong>
              <span>RUTA SOCIAL</span>
              <small className="inline-flex items-start gap-1.5">
                <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                Parque del Ingenio y sus alrededores
              </small>
            </div>
          </div>
        </div>

        <div className="v2-hero-footer shell" aria-hidden="true">
          <span>RUN · CONNECT · CELEBRATE</span>
          <span>PARQUE DEL INGENIO</span>
          <span>ANIVERSARIO NEOTEAM</span>
        </div>
      </section>

      {/* Outside the hero only on mobile, so the main title and actions can breathe. */}
      <section className="v2-mobile-route" aria-label="Ruta social de cinco kilómetros">
        <div className="shell">
          <div className="v2-mobile-route-heading">
            <span>EL RECORRIDO</span>
            <span>CALI, COLOMBIA</span>
          </div>
          <div className="v2-mobile-route-content">
            <div className="v2-mobile-route-distance">
              <strong>5K</strong>
              <span>RUTA SOCIAL</span>
            </div>
            <p className="v2-mobile-route-location">
              <MapPin aria-hidden className="size-5 shrink-0" />
              <span>Parque del Ingenio y sus alrededores</span>
            </p>
          </div>
          <div className="v2-mobile-route-footer" aria-hidden="true">
            <span>RUN · CONNECT · CELEBRATE</span>
            <span>PARQUE DEL INGENIO</span>
          </div>
        </div>
      </section>
    </>
  )
}
