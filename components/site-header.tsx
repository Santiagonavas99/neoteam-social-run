import Link from 'next/link'
import { BrandLink } from './brand-link'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  return (
    <header className="site-header">
      <BrandLink label="Social Run NeoTeam" />
      <nav aria-label="Navegación principal">
        <a href="/#evento">Evento</a>
        <a href="/#agenda">Agenda</a>
        <a href="/#invitados">Invitados</a>
        <Link href="/pase">Mi pase</Link>
        <ThemeToggle />
        <Link className="button button-small" href="/registro">
          Registrarme
        </Link>
      </nav>
    </header>
  )
}
