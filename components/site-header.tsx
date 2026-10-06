import Link from 'next/link'
import { BrandLink } from './brand-link'

export function SiteHeader() {
  return (
    <header className="site-header">
      <BrandLink label="Social Run NeoTeam" />
      <nav aria-label="Navegación principal">
        <a href="/#evento">Evento</a>
        <a href="/#agenda">Agenda</a>
        <a href="/#invitados">Invitados</a>
        <Link className="button button-small" href="/registro">
          Registrarme
        </Link>
      </nav>
    </header>
  )
}
