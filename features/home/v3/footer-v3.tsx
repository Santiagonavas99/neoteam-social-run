import Link from 'next/link'

const footerLinks = [
  ['El plan', '#evento-v3'],
  ['Agenda', '#agenda-v3'],
  ['Crews y marcas', '#invitados-v3'],
  ['Registro', '/registro'],
  ['Mi pase', '/pase'],
] as const

export function FooterV3() {
  return (
    <footer className="v3-footer">
      <div className="v3-shell v3-footer-top">
        <div className="v3-footer-intro">
          <strong>NEOTEAM · SOCIAL RUN</strong>
          <span>ANIVERSARIO · 18 OCT 2026 · CALI</span>
        </div>

        <nav aria-label="Navegación del cierre">
          {footerLinks.map(([label, href]) =>
            href.startsWith('/') ? (
              <Link href={href} key={href}>
                {label}
              </Link>
            ) : (
              <a href={href} key={href}>
                {label}
              </a>
            ),
          )}
        </nav>

        <p>
          Corre.
          <br />
          Conecta.
          <br />
          Celebra.
        </p>
      </div>

      <div className="v3-footer-display" aria-hidden="true">
        CELEBREMOS
      </div>

      <div className="v3-shell v3-footer-bottom">
        <span>NEOTEAM · SOCIAL RUN 2026</span>
        <span>HECHO PARA CORRER JUNTOS.</span>
      </div>
    </footer>
  )
}
