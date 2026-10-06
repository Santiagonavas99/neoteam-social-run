import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const links = [
  { href: '/registro', label: 'Registro' },
  { href: '/pase', label: 'Mi pase' },
  { href: '/#agenda', label: 'Agenda' },
]

export function Footer() {
  return (
    <footer className="footer flex-wrap items-center">
      <strong>NEOTEAM · SOCIAL RUN</strong>
      <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-5">
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
        Creado por Landak Studio
        <ArrowUpRight aria-hidden className="size-4 shrink-0" />
      </a>
    </footer>
  )
}
