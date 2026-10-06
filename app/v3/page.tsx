import { getHomeCommunity, getHomeLogoCarouselItems } from '@/features/home/data'
import { HomeV3 } from '@/features/home/v3/home-v3'

export const dynamic = 'force-dynamic'

export default async function HomeV3Page() {
  const [logoItems, community] = await Promise.all([getHomeLogoCarouselItems(), getHomeCommunity()])

  return <HomeV3 logoItems={logoItems} community={community} />
}
