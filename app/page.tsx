import { Footer } from '@/components/footer'
import { SiteHeader } from '@/components/site-header'
import {
  organizationMarqueeItems,
  runningCrewMarqueeItems,
} from '@/features/home/community-marquees'
import {
  getHomeCommunity,
  getHomeLogoCarouselItems,
  getHomeSectionOrder,
  getRegisteredCount,
} from '@/features/home/data'
import { LogoMarquee } from '@/features/home/logo-marquee'
import { Agenda } from '@/features/home/sections/agenda'
import { Community } from '@/features/home/sections/community'
import { Final } from '@/features/home/sections/final'
import { Hero } from '@/features/home/sections/hero'
import { LandakStudio } from '@/features/home/sections/landak-studio'
import { Numbers } from '@/features/home/sections/numbers'
import { Raffle } from '@/features/home/sections/raffle'
import { Story } from '@/features/home/sections/story'

// Served from the CDN and rebuilt in the background at most once a minute; counter, logos and
// section ordering and visibility may lag 60 s.
export const revalidate = 60

const numberedSections = new Set(['story', 'agenda', 'community', 'raffle', 'final'])

export default async function Home() {
  const [logoItems, community, registered, sectionOrder] = await Promise.all([
    getHomeLogoCarouselItems(),
    getHomeCommunity(),
    getRegisteredCount(),
    getHomeSectionOrder(),
  ])

  const otherBrands = community.brands.filter((brand) => brand.type !== 'organizer')
  const visibleSections = sectionOrder.filter((section) => section.visible)
  let editorialIndex = 0

  const sections = visibleSections.map(({ section_key }) => {
    const index = numberedSections.has(section_key)
      ? String(++editorialIndex).padStart(2, '0')
      : undefined

    switch (section_key) {
      case 'story':
        return <Story key={section_key} index={index} />
      case 'numbers':
        return <Numbers key={section_key} registered={registered} brands={logoItems.length} />
      case 'allies':
        return <LogoMarquee key={section_key} items={logoItems} />
      case 'running_crews':
        return (
          <LogoMarquee
            key={section_key}
            items={runningCrewMarqueeItems(community.groups, logoItems)}
            title="Running crews"
          />
        )
      case 'organizations':
        return (
          <LogoMarquee
            key={section_key}
            items={organizationMarqueeItems(community.brands, logoItems)}
            title="Organizaciones"
          />
        )
      case 'agenda':
        return <Agenda key={section_key} index={index} />
      case 'community':
        return <Community key={section_key} brands={otherBrands} index={index} />
      case 'raffle':
        return <Raffle key={section_key} index={index} />
      case 'final':
        return <Final key={section_key} index={index} />
      case 'landak_studio':
        return <LandakStudio key={section_key} />
      default:
        return null
    }
  })

  return (
    <main className="home-v2">
      <SiteHeader />
      <Hero />
      {sections}
      <Footer />
    </main>
  )
}
