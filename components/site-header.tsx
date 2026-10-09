import Link from 'next/link'
import { LandingRegistrationCta } from '@/features/registration/landing-registration-status'
import { BrandLink } from './brand-link'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <BrandLink label="Social Run NeoTeam" />
        <nav aria-label="Navegación principal">
          <a href="/#evento">Evento</a>
          <a href="/#agenda">Agenda</a>
          <Link href="/pase">Mi pase</Link>
          <ThemeToggle />
          <LandingRegistrationCta label="Registrarme" compact />
        </nav>
      </div>
    </header>
  )
}
