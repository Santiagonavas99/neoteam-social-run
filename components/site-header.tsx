import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Social Run NeoTeam">
        <span className="brand-mark">N</span>
        <span>NEOTEAM</span>
      </Link>
      <nav aria-label="Navegación principal">
        <a href="/#evento">Evento</a>
        <a href="/#agenda">Agenda</a>
        <a href="/#invitados">Invitados</a>
        <Link className="button button-small" href="/registro">Registrarme</Link>
      </nav>
    </header>
  );
}

