import { Gift } from 'lucide-react'
import { LandingRegistrationCta } from '@/features/registration/landing-registration-status'

export function Raffle({ index = '04' }: { index?: string }) {
  return (
    <section className="v2-raffle" aria-labelledby="raffle-title">
      <div className="v2-raffle-copy reveal">
        <div>
          <p className="section-label">{index} / RIFAS</p>
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
      <div className="v2-raffle-side reveal">
        <span className="inline-flex items-center gap-2">
          <Gift aria-hidden className="size-4 shrink-0" />
          DESPUÉS DE LA RUTA
        </span>
        <strong>8:45</strong>
        <p>
          Celebración, reconocimiento a las marcas aliadas, rifas, premios y contenido con la
          comunidad.
        </p>
        <LandingRegistrationCta label="Registrarme" />
      </div>
    </section>
  )
}
