import { CommunityCarousel } from '../community-carousel'
import type { CommunityLogo } from '../data'

export function Community({ brands, index = '03' }: { brands: CommunityLogo[]; index?: string }) {
  const sponsors = brands.filter((brand) => brand.type === 'sponsor')
  const partners = brands.filter(
    (brand) => brand.type === 'main_partner' || brand.type === 'invited',
  )

  if (!sponsors.length && !partners.length) return null

  return (
    <section className="v2-community" id="invitados">
      <div className="shell">
        <header className="v2-community-head reveal">
          <span className="v2-index">{index} / COMUNIDAD</span>
          <h2>
            CORREMOS
            <br />
            ACOMPAÑADOS.
          </h2>
          <p>
            Marcas y aliados que hacen que el encuentro sea más grande que solo cinco kilómetros.
          </p>
        </header>

        <div className="logo-panels reveal">
          <CommunityCarousel
            items={sponsors}
            title="MARCAS"
            description="Marcas que nos acompañan"
          />
          <CommunityCarousel
            items={partners}
            title="PARTNERS / MARCAS INVITADAS"
            description="Activaciones · producto · experiencias"
          />
        </div>
      </div>
    </section>
  )
}
