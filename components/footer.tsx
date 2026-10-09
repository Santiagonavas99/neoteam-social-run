import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { LandingRegistrationFooterLink } from '@/features/registration/landing-registration-status'

const links = [
  { href: '/pase', label: 'Mi pase' },
  { href: '/#agenda', label: 'Agenda' },
  { href: '/legal/terminos', label: 'Condiciones' },
  { href: '/legal/privacidad', label: 'Privacidad' },
]

export function Footer() {
  return (
    <footer className="footer flex-wrap items-center">
      <strong>NEOTEAM · SOCIAL RUN</strong>
      <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-5">
        <LandingRegistrationFooterLink />
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="text-link">
            {label}
          </Link>
        ))}
      </nav>
      <span>18 de octubre de 2026 · Hecho para correr juntos.</span>
      <a
        href="https://landak.pro/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-link gap-1.5"
        aria-label="Creado por Landak Studio (abre en una nueva pestaña)"
      >
        <span>
          Creado por <span className="text-neo-landak">Landak Studio</span>
        </span>
        <ArrowUpRight aria-hidden className="size-4 shrink-0" />
      </a>
    </footer>
  )
}
