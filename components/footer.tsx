import Link from 'next/link'

const links = [
  { href: '/registro', label: 'Registro' },
  { href: '/pase', label: 'Mi pase' },
  { href: '/#agenda', label: 'Agenda' },
]

export function Footer() {
  return (
    <footer className="footer">
      <strong>NEOTEAM · SOCIAL RUN</strong>
      <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-5">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className="text-link">
            {label}
          </Link>
        ))}
      </nav>
      <span>18 de octubre de 2026</span>
    </footer>
  )
}
