import { ArrowUpRight } from 'lucide-react'

export function LandakStudio() {
  return (
    <section className="v2-landak" aria-labelledby="landak-studio-title">
      <div className="shell v2-landak-grid">
        <div className="v2-landak-brand reveal">
          <p className="section-label">CREATIVE PARTNER</p>
          <p className="v2-landak-wordmark" aria-label="Landak Studio">
            <span>LANDAK</span>
            <span>STUDIO</span>
          </p>
          <p className="v2-landak-services">WEB DESIGN · UX/UI · BRANDING · VISUAL</p>
        </div>

        <div className="v2-landak-copy reveal">
          <h2 id="landak-studio-title">ESTA EXPERIENCIA DIGITAL TAMBIÉN LA CONSTRUIMOS.</h2>
          <p>
            Diseño, UX/UI y desarrollo web para marcas que quieren moverse con intención.
          </p>
          <a
            href="https://landak.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="button"
          >
            Conoce Landak Studio <ArrowUpRight aria-hidden className="size-4 shrink-0" />
          </a>
        </div>
      </div>
    </section>
  )
}
