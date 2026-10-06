import { ArrowDown, ArrowRight, CalendarDays, MapPin, QrCode, Route } from 'lucide-react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { EventCountdown } from '@/features/event/event-countdown'
import { eventConfig } from '@/features/event/event'
import { homeV3Content } from './content'

export function HeroV3() {
  const { hero } = homeV3Content

  return (
    <section className="v3-hero">
      <SiteHeader />

      <div className="v3-shell v3-hero-body">
        <div className="v3-hero-copy">
          <p className="v3-eyebrow">{hero.eyebrow}</p>
          <h1>
            <span>{hero.headline}</span>
            <em>{hero.accent}</em>
          </h1>
        </div>

        <aside className="v3-hero-aside">
          <p className="v3-hero-support">{hero.support}</p>
          <EventCountdown
            startsAt={eventConfig.startsAt}
            endsAt={eventConfig.endsAt}
            initialNow={Date.now()}
          />
          <div className="v3-actions">
            <Link href="/registro" className="button v3-primary-action">
              Quiero participar <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
            <Link href="/pase" className="v3-text-link">
              Mi pase <QrCode aria-hidden className="size-4 shrink-0" />
            </Link>
            <a href="#agenda-v3" className="v3-text-link">
              Ver agenda <ArrowDown aria-hidden className="size-4 shrink-0" />
            </a>
          </div>
        </aside>
      </div>

      <div className="v3-shell v3-hero-meta" aria-label="Datos principales del evento">
        <div>
          <CalendarDays aria-hidden className="size-4" />
          <span>18 OCT · 2026</span>
        </div>
        <div>
          <Route aria-hidden className="size-4" />
          <span>5K SOCIAL</span>
        </div>
        <div>
          <MapPin aria-hidden className="size-4" />
          <span>PARQUE DEL INGENIO · CALI</span>
        </div>
      </div>
    </section>
  )
}
