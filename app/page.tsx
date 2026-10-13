import { Footer } from '@/components/footer'
import { SiteHeader } from '@/components/site-header'
import { SocialRail } from '@/components/social-rail'
import {
  alliedRaceMarqueeItems,
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
import { Steps } from '@/features/home/sections/steps'
import { Story } from '@/features/home/sections/story'
import { LandingRegistrationProvider } from '@/features/registration/landing-registration-status'
import { getRegistrationSettings } from '@/features/registration/registration-settings'

// Served from the CDN and rebuilt at most once a minute. Cached HTML is safe for the CTA:
// the deadline is evaluated client-side with the live clock and LandingRegistrationProvider
// refetches /api/registration-status on mount, so a manual close shows up right after paint.
export const revalidate = 60

const numberedSections = new Set(['story', 'agenda', 'community', 'raffle', 'final'])

export default async function Home() {
  const [logoItems, raceItems, community, registered, sectionOrder, registrationSettings] =
    await Promise.all([
      getHomeLogoCarouselItems('brand'),
      getHomeLogoCarouselItems('race'),
      getHomeCommunity(),
      getRegisteredCount(),
      getHomeSectionOrder(),
      getRegistrationSettings(),
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
      case 'steps':
        return <Steps key={section_key} />
      case 'numbers':
        return <Numbers key={section_key} registered={registered} brands={logoItems.length} />
      case 'allies':
        return <LogoMarquee key={section_key} items={logoItems} />
      case 'races':
        return (
          <LogoMarquee
            key={section_key}
            items={alliedRaceMarqueeItems(raceItems, logoItems)}
            title="Carreras aliadas"
          />
        )
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
    <LandingRegistrationProvider initialSettings={registrationSettings}>
      <SocialRail />
      <main className="home-v2">
        <SiteHeader />
        <Hero />
        {sections}
        <Footer />
      </main>
    </LandingRegistrationProvider>
  )
}
