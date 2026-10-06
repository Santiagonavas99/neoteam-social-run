import type { HomeLogoCarouselItem, CommunityLogo } from '@/features/home/data'
import { LogoMarquee } from '@/features/home/logo-marquee'
import { AgendaV3 } from './agenda-v3'
import { AnniversarySplit } from './anniversary-split'
import { CommunityV3 } from './community-v3'
import { FinalV3 } from './final-v3'
import { FooterV3 } from './footer-v3'
import { HeroV3 } from './hero-v3'
import { ManifestoV3 } from './manifesto-v3'

type HomeV3Props = {
  logoItems: HomeLogoCarouselItem[]
  community: {
    groups: CommunityLogo[]
    brands: CommunityLogo[]
  }
}

export function HomeV3({ logoItems, community }: HomeV3Props) {
  return (
    <main className="home-v3">
      <HeroV3 />
      <LogoMarquee items={logoItems} />
      <ManifestoV3 />
      <AgendaV3 />
      <AnniversarySplit variant="together" />
      <CommunityV3 community={community} />
      <AnniversarySplit variant="after" />
      <FinalV3 />
      <FooterV3 />
    </main>
  )
}
