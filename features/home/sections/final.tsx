import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react'
import Link from 'next/link'
import { eventConfig } from '@/features/event/event'
import { mapsEmbedUrl, mapsUrl } from '@/features/event/maps'
import { AddToCalendar } from '../add-to-calendar'

export function Final() {
  return (
    <section className="v2-final">
      <div className="shell v2-final-grid">
        <span className="v2-index">05 / NOS VEMOS</span>
        <div className="v2-final-main reveal">
          <p>DOMINGO · SOCIAL RUN · ANIVERSARIO NEOTEAM</p>
          <h2>18.10.26</h2>
          <div className="v2-final-actions">
            <Link href="/registro" className="button">
              Quiero estar ahí <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
            <AddToCalendar />
          </div>
        </div>
        <div className="v2-meeting reveal">
          <p className="section-label inline-flex items-center gap-1.5">
            <MapPin aria-hidden className="size-3.5 shrink-0" />
            PUNTO DE ENCUENTRO
          </p>
          <h3>{eventConfig.location}</h3>
          <iframe
            src={mapsEmbedUrl(eventConfig.location)}
            title="Mapa del punto de encuentro"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={mapsUrl(eventConfig.location)}
            target="_blank"
            rel="noopener"
            className="text-link"
          >
            Abrir en Google Maps <ArrowUpRight aria-hidden className="size-4 shrink-0" />
          </a>
        </div>
      </div>
    </section>
  )
}
