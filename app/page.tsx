import Link from "next/link";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { CommunityCarousel } from "@/components/community-carousel";
import { LogoMarquee } from "@/components/logo-marquee";
import { agenda, eventConfig } from "@/lib/event";
import { getHomeCommunity, getHomeLogoCarouselItems } from "@/lib/home-features";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [logoItems, community] = await Promise.all([getHomeLogoCarouselItems(), getHomeCommunity()]);
  const organizers = community.brands.filter(brand => brand.type === "organizer");
  const sponsors = community.brands.filter(brand => brand.type === "sponsor");
  const partners = community.brands.filter(brand => brand.type === "main_partner" || brand.type === "invited");

  return (
    <main>
      <section className="hero">
        <SiteHeader />
        <div className="hero-grid shell">
          <div className="hero-copy">
            <p className="kicker">{eventConfig.eyebrow}</p>
            <h1>SOCIAL<br />RUN</h1>
            <p className="hero-lead">{eventConfig.headline}</p>
            <div className="hero-actions">
              <Link href="/registro" className="button">Quiero participar <span>↗</span></Link>
              <a href="#evento" className="text-link">Conoce el evento ↓</a>
            </div>
          </div>
          <aside className="date-card">
            <span>DOMINGO</span>
            <strong>18</strong>
            <span>OCTUBRE · 2026</span>
            <div className="route-line" />
            <small>{eventConfig.location}</small>
          </aside>
        </div>
        <div className="hero-ticker" aria-hidden="true">
          <span>RUN · CONNECT · CELEBRATE · NEOTEAM · RUN · CONNECT · CELEBRATE · NEOTEAM</span>
        </div>
      </section>

      <section className="intro shell" id="evento">
        <div>
          <p className="section-label">EL PLAN</p>
          <h2>NO ES UNA CARRERA MÁS.<br />ES NUESTRO PUNTO DE ENCUENTRO.</h2>
        </div>
        <div className="intro-copy">
          <p>{eventConfig.description}</p>
          <div className="facts">
            <div><strong>18 OCT</strong><span>Fecha</span></div>
            <div><strong>07:30</strong><span>Encuentro</span></div>
            <div><strong>5K</strong><span>Ruta</span></div>
          </div>
        </div>
      </section>

      <LogoMarquee items={logoItems} />

      <section className="agenda-section" id="agenda">
        <div className="shell agenda-grid">
          <div className="agenda-title">
            <p className="section-label light">18 OCT · 2026</p>
            <h2>UNA MAÑANA<br />PARA CORRER<br />Y QUEDARSE.</h2>
            <p>Una mañana para correr, conectar y celebrar juntos.</p>
          </div>
          <div className="agenda-list">
            {agenda.map(({ time, meridiem, title, details }) => (
              <div className="agenda-row" key={`${time}-${title}`}>
                <strong>
                  {time}
                  <small style={{ display: "block", marginTop: 5, fontSize: 10, letterSpacing: ".04em", color: "#abb7b1" }}>
                    {meridiem}
                  </small>
                </strong>
                <div>
                  <span>{title}</span>
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#abb7b1", fontSize: 13, lineHeight: 1.55 }}>
                    {details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(community.groups.length > 0 || organizers.length + sponsors.length + partners.length > 0) && <section className="community shell" id="invitados">
        <div className="community-heading">
          <p className="section-label">COMUNIDAD</p>
          <h2>CORREMOS<br />ACOMPAÑADOS.</h2>
          <p>Las comunidades y marcas que acompañan este encuentro.</p>
        </div>
        <div className="logo-panels">
          <CommunityCarousel items={community.groups} title="RUNNING CREWS" description="comunidades que se suman" />
          <CommunityCarousel items={organizers} title="ORGANIZACIÓN" description="quienes hacen posible este encuentro" />
          <CommunityCarousel items={sponsors} title="MARCAS" description="marcas que nos acompañan" />
          <CommunityCarousel items={partners} title="PARTNERS / MARCAS INVITADAS" description="activaciones · producto · experiencias" />
        </div>
      </section>}

      <section className="raffle shell">
        <div className="raffle-card">
          <p className="section-label light">RIFAS</p>
          <h2>TU PRÓXIMA<br />CARRERA PUEDE<br />EMPEZAR AQUÍ.</h2>
          <p>Inscripciones a carreras y premios de marcas invitadas para celebrar el aniversario de NeoTeam.</p>
          <Link href="/registro" className="button button-light">Registrarme</Link>
        </div>
      </section>

      <section className="final-cta shell">
        <p className="section-label">NOS VEMOS EN LA SALIDA</p>
        <h2>18.10.26</h2>
        <Link href="/registro" className="button">Quiero estar ahí <span>↗</span></Link>
      </section>
      <Footer />
    </main>
  );
}
