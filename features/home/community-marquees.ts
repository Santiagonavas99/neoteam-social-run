import type { CommunityLogo } from './data'

export type CommunityMarqueeItem = {
  id: string
  name: string
  logo_url: string | null
  website?: string | null
  instagram?: string | null
}

export function runningCrewMarqueeItems(groups: CommunityLogo[]): CommunityMarqueeItem[] {
  return groups.map(({ id, name, logo_url, website, instagram }) => ({
    id,
    name,
    logo_url,
    website,
    instagram,
  }))
}

export function organizationMarqueeItems(brands: CommunityLogo[]): CommunityMarqueeItem[] {
  return brands
    .filter((brand) => brand.type === 'organizer')
    .map(({ id, name, logo_url, website, instagram }) => ({
      id,
      name,
      logo_url,
      website,
      instagram,
    }))
}
