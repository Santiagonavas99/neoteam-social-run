import { CommunityCarousel } from '../community-carousel'
import type { CommunityLogo } from '../data'

export function Community({
  community,
}: {
  community: { groups: CommunityLogo[]; brands: CommunityLogo[] }
}) {
  const organizers = community.brands.filter((brand) => brand.type === 'organizer')
  const sponsors = community.brands.filter((brand) => brand.type === 'sponsor')
  const partners = community.brands.filter(
    (brand) => brand.type === 'main_partner' || brand.type === 'invited',
  )

  if (!community.groups.length && !organizers.length && !sponsors.length && !partners.length)
    return null

  return (
    <section className="v2-community" id="invitados">
      <div className="shell">
        <header className="v2-community-head reveal">
          <span className="v2-index">03 / COMUNIDAD</span>
          <h2>
            CORREMOS
            <br />
            ACOMPAÑADOS.
          </h2>
          <p>
            Crews, marcas y aliados que hacen que el encuentro sea más grande que solo cinco
            kilómetros.
          </p>
        </header>

        <div className="logo-panels reveal">
          <CommunityCarousel
            items={community.groups}
            title="RUNNING CREWS"
            description="comunidades que se suman"
          />
          <CommunityCarousel
            items={organizers}
            title="ORGANIZACIÓN"
            description="quienes hacen posible este encuentro"
          />
          <CommunityCarousel
            items={sponsors}
            title="MARCAS"
            description="marcas que nos acompañan"
          />
          <CommunityCarousel
            items={partners}
            title="PARTNERS / MARCAS INVITADAS"
            description="activaciones · producto · experiencias"
          />
        </div>
      </div>
    </section>
  )
}
