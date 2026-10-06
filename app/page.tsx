import { ArrowDown, ArrowRight, CalendarDays, Clock, Gift, MapPin, Route } from 'lucide-react'
import Link from 'next/link'
import { CommunityCarousel } from '@/components/community-carousel'
import { EventCountdown } from '@/components/event-countdown'
import { Footer } from '@/components/footer'
import { LogoMarquee } from '@/components/logo-marquee'
import { SiteHeader } from '@/components/site-header'
import { agenda, eventConfig } from '@/lib/event'
import { getHomeCommunity, getHomeLogoCarouselItems } from '@/lib/home-features'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [logoItems, community] = await Promise.all([getHomeLogoCarouselItems(), getHomeCommunity()])
  const organizers = community.brands.filter((brand) => brand.type === 'organizer')
  const sponsors = community.brands.filter((brand) => brand.type === 'sponsor')
  const partners = community.brands.filter(
    (brand) => brand.type === 'main_partner' || brand.type === 'invited',
  )

  return (
    <main className="home-v2">
      <section className="v2-hero">
        <SiteHeader />

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
            <div className="v2-hero-actions">
              <Link href="/registro" className="button">
                Quiero participar <ArrowRight aria-hidden className="size-4 shrink-0" />
              </Link>
              <a href="#agenda" className="text-link">
                Ver agenda <ArrowDown aria-hidden className="size-4 shrink-0" />
              </a>
            </div>
            <div className="v2-route-card">
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

      <section className="v2-story shell" id="evento">
        <span className="v2-index">01 / EL PLAN</span>
        <div className="v2-story-copy">
          <p className="section-label">UN PUNTO DE ENCUENTRO</p>
          <h2>
            NO VENIMOS A <em>COMPETIR.</em>
            <br />
            VENIMOS A CORRER JUNTOS.
          </h2>
        </div>
        <div className="v2-story-aside">
          <p>{eventConfig.description}</p>
          <div className="v2-fact-list">
            <div className="v2-fact">
              <strong>18 OCT</strong>
              <span>Fecha</span>
            </div>
            <div className="v2-fact">
              <strong>07:30</strong>
              <span>Encuentro</span>
            </div>
            <div className="v2-fact">
              <strong>5K</strong>
              <span>Ruta social</span>
            </div>
          </div>
        </div>
      </section>

      <LogoMarquee items={logoItems} />

      <section className="v2-agenda" id="agenda">
        <div className="shell">
          <header className="v2-section-head">
            <span className="v2-index">02 / AGENDA</span>
            <h2>
              UNA MAÑANA
              <br />
              CON RITMO.
            </h2>
            <p>
              Desde la llegada hasta la foto final: correr, recuperar, compartir y celebrar el
              aniversario juntos.
            </p>
          </header>

          <div className="v2-agenda-grid">
            {agenda.map(({ time, meridiem, title, details }, index) => {
              const specialClass =
                title === 'Ruta 5K'
                  ? ' route'
                  : title === 'Celebración y rifas'
                    ? ' celebration'
                    : ''
              return (
                <article className={`v2-agenda-card${specialClass}`} key={`${time}-${title}`}>
                  <div className="v2-agenda-top">
                    <div className="v2-agenda-time">
                      {time}
                      <small>{meridiem}</small>
                    </div>
                    <span className="v2-agenda-number">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{title}</h3>
                  <ul>
                    {details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {(community.groups.length > 0 ||
        organizers.length + sponsors.length + partners.length > 0) && (
        <section className="v2-community" id="invitados">
          <div className="shell">
            <header className="v2-community-head">
              <span className="v2-index">03 / COMUNIDAD</span>
              <h2>
                CORREMOS
                <br />
                ACOMPAÑADOS.
              </h2>
              <p>
                Crews, marcas y aliados que hacen que el encuentro sea más grande que solo cinco
                kilómetros.
              </p>
            </header>

            <div className="logo-panels">
              <CommunityCarousel
                items={community.groups}
                title="RUNNING CREWS"
                description="comunidades que se suman"
              />
              <CommunityCarousel
                items={organizers}
                title="ORGANIZACIÓN"
                description="quienes hacen posible este encuentro"
              />
              <CommunityCarousel
                items={sponsors}
                title="MARCAS"
                description="marcas que nos acompañan"
              />
              <CommunityCarousel
                items={partners}
                title="PARTNERS / MARCAS INVITADAS"
                description="activaciones · producto · experiencias"
              />
            </div>
          </div>
        </section>
      )}

      <section className="v2-raffle" aria-labelledby="raffle-title">
        <div className="v2-raffle-copy">
          <div>
            <p className="section-label">04 / RIFAS</p>
            <h2 id="raffle-title">
              CORRES.
              <br />
              CELEBRAS.
              <br />
              GANAS.
            </h2>
          </div>
          <p>
            Premios e inscripciones aportados por nuestras marcas aliadas para cerrar la mañana
            celebrando a la comunidad.
          </p>
        </div>
        <div className="v2-raffle-side">
          <span className="inline-flex items-center gap-2">
            <Gift aria-hidden className="size-4 shrink-0" />
            DESPUÉS DE LA RUTA
          </span>
          <strong>8:45</strong>
          <p>
            Celebración, reconocimiento a las marcas aliadas, rifas, premios y contenido con la
            comunidad.
          </p>
          <Link href="/registro" className="button">
            Registrarme <ArrowRight aria-hidden className="size-4 shrink-0" />
          </Link>
        </div>
      </section>

      <section className="v2-final">
        <div className="shell v2-final-grid">
          <span className="v2-index">05 / NOS VEMOS</span>
          <div className="v2-final-main">
            <p>DOMINGO · SOCIAL RUN · ANIVERSARIO NEOTEAM</p>
            <h2>18.10.26</h2>
            <Link href="/registro" className="button">
              Quiero estar ahí <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
