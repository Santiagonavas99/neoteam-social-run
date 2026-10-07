import { Footer } from '@/components/footer'
import {
  getHomeCommunity,
  getHomeLogoCarouselItems,
  getRegisteredCount,
} from '@/features/home/data'
import { LogoMarquee } from '@/features/home/logo-marquee'
import { Agenda } from '@/features/home/sections/agenda'
import { Community } from '@/features/home/sections/community'
import { Final } from '@/features/home/sections/final'
import { Hero } from '@/features/home/sections/hero'
import { Numbers } from '@/features/home/sections/numbers'
import { Raffle } from '@/features/home/sections/raffle'
import { Story } from '@/features/home/sections/story'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [logoItems, community, registered] = await Promise.all([
    getHomeLogoCarouselItems(),
    getHomeCommunity(),
    getRegisteredCount(),
  ])

  return (
    <main className="home-v2">
      <Hero />
      <Story />
      <Numbers registered={registered} brands={logoItems.length} />
      <LogoMarquee items={logoItems} />
      <Agenda />
      <Community community={community} />
      <Raffle />
      <Final />
      <Footer />
    </main>
  )
}
