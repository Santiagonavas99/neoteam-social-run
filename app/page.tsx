import Link from "next/link";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { agenda, eventConfig } from "@/lib/event";
import { getHomeCommunity, getHomeFeatureCards } from "@/lib/home-features";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [features, community] = await Promise.all([getHomeFeatureCards(), getHomeCommunity()]);

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
            <div><strong>06:00</strong><span>Encuentro</span></div>
            <div><strong>SOCIAL</strong><span>Formato</span></div>
          </div>
        </div>
      </section>

      <section className="feature-grid shell" aria-label="Características del Social Run">
        {features.map((feature) => (
          <article className="feature-card" key={feature.slot}>
            <span>{String(feature.sort_order).padStart(2, "0")}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="agenda-section" id="agenda">
        <div className="shell agenda-grid">
          <div className="agenda-title">
            <p className="section-label light">18 OCT · 2026</p>
            <h2>UNA MAÑANA<br />PARA CORRER<br />Y QUEDARSE.</h2>
            <p>Horarios iniciales de trabajo. Los dejamos centralizados para poder actualizarlos luego desde configuración.</p>
          </div>
          <div className="agenda-list">
            {agenda.map(([time, name]) => (
              <div className="agenda-row" key={`${time}-${name}`}>
                <strong>{time}</strong>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="community shell" id="invitados">
        <div className="community-heading">
          <p className="section-label">COMUNIDAD</p>
          <h2>CORREMOS<br />ACOMPAÑADOS.</h2>
          <p>Las comunidades y marcas que acompañan este encuentro.</p>
        </div>
        <div className="logo-panels">
          <div className="logo-panel">
            <span>RUNNING CREWS</span>
            <div className="community-logo-grid">
              {community.groups.length ? community.groups.map(group => <div className="community-logo" key={group.id}>{group.logo_url ? <img src={group.logo_url} alt={group.name} /> : <strong>{group.name}</strong>}</div>) : <strong>NEOTEAM</strong>}
            </div>
            <small>comunidades que se suman</small>
          </div>
          <div className="logo-panel inverted">
            <span>MARCAS INVITADAS</span>
            <div className="community-logo-grid">
              {community.brands.length ? community.brands.map(brand => <div className="community-logo" key={brand.id}>{brand.logo_url ? <img src={brand.logo_url} alt={brand.name} /> : <strong>{brand.name}</strong>}</div>) : <strong>PARTNERS</strong>}
            </div>
            <small>activaciones · producto · experiencias</small>
          </div>
        </div>
      </section>

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
