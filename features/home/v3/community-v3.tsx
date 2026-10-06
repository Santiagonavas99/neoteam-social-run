import { CommunityCarousel } from '@/features/home/community-carousel'
import type { CommunityLogo } from '@/features/home/data'
import { homeV3Content } from './content'

export function CommunityV3({
  community,
}: {
  community: { groups: CommunityLogo[]; brands: CommunityLogo[] }
}) {
  const organizers = community.brands.filter((brand) => brand.type === 'organizer')
  const sponsors = community.brands.filter((brand) => brand.type === 'sponsor')
  const partners = community.brands.filter(
    (brand) => brand.type === 'main_partner' || brand.type === 'invited',
  )

  if (!community.groups.length && !organizers.length && !sponsors.length && !partners.length) {
    return null
  }

  return (
    <section className="v3-community" id="invitados-v3">
      <div className="v3-shell">
        <header className="v3-community-head">
          <p className="v3-section-index">03 / {homeV3Content.community.eyebrow}</p>
          <h2>{homeV3Content.community.headline}</h2>
          <p>{homeV3Content.community.body}</p>
        </header>

        <div className="v3-community-panels">
          <CommunityCarousel
            items={community.groups}
            title="RUNNING CREWS"
            description="comunidades que se suman al aniversario"
          />
          <CommunityCarousel
            items={organizers}
            title="ORGANIZACIÓN"
            description="quienes hacen posible este encuentro"
          />
          <CommunityCarousel
            items={sponsors}
            title="MARCAS"
            description="marcas que celebran con nosotros"
          />
          <CommunityCarousel
            items={partners}
            title="PARTNERS / INVITADOS"
            description="activaciones · producto · experiencias"
          />
        </div>
      </div>
    </section>
  )
}
