import { ArrowRight, Gift } from 'lucide-react'
import Link from 'next/link'

export function Raffle() {
  return (
    <section className="v2-raffle" aria-labelledby="raffle-title">
      <div className="v2-raffle-copy">
        <div>
          <p className="section-label">04 / RIFAS</p>
          <h2 id="raffle-title">
            CORRES.
            <br />
            CELEBRAS.
            <br />
            GANAS.
          </h2>
        </div>
        <p>
          Premios e inscripciones aportados por nuestras marcas aliadas para cerrar la mañana
          celebrando a la comunidad.
        </p>
      </div>
      <div className="v2-raffle-side">
        <span className="inline-flex items-center gap-2">
          <Gift aria-hidden className="size-4 shrink-0" />
          DESPUÉS DE LA RUTA
        </span>
        <strong>8:45</strong>
        <p>
          Celebración, reconocimiento a las marcas aliadas, rifas, premios y contenido con la
          comunidad.
        </p>
        <Link href="/registro" className="button">
          Registrarme <ArrowRight aria-hidden className="size-4 shrink-0" />
        </Link>
      </div>
    </section>
  )
}
