import type { CommunityLogo, HomeLogoCarouselItem } from './data'

export type CommunityMarqueeItem = {
  id: string
  name: string
  logo_url: string | null
  website?: string | null
  instagram?: string | null
}

type MarqueeSource = {
  id: string
  name: string
  logo_url: string | null
  website?: string | null
  instagram?: string | null
  sort_order: number
}

type Candidate = {
  item: CommunityMarqueeItem
  sort_order: number
  sequence: number
  native: boolean
}

function normalizeName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeLogoUrl(value: string | null) {
  return value?.trim().split(/[?#]/, 1)[0]?.replace(/\/+$/, '').toLowerCase() ?? ''
}

function sameEntity(left: CommunityMarqueeItem, right: CommunityMarqueeItem) {
  const leftName = normalizeName(left.name)
  const rightName = normalizeName(right.name)
  if (leftName && rightName && leftName === rightName) return true

  const leftLogo = normalizeLogoUrl(left.logo_url)
  const rightLogo = normalizeLogoUrl(right.logo_url)
  return !!leftLogo && leftLogo === rightLogo
}

function mergeItems(
  nativeItems: MarqueeSource[],
  allies: HomeLogoCarouselItem[],
  include: 'show_in_running_crews' | 'show_in_organizations',
): CommunityMarqueeItem[] {
  const candidates: Candidate[] = nativeItems.map((item, sequence) => ({
    item: {
      id: item.id,
      name: item.name,
      logo_url: item.logo_url,
      website: item.website,
      instagram: item.instagram,
    },
    sort_order: item.sort_order,
    sequence,
    native: true,
  }))

  for (const ally of allies) {
    if (!ally.active || !ally[include]) continue
    candidates.push({
      item: {
        id: `ally-${ally.id}`,
        name: ally.name,
        logo_url: ally.logo_url,
        website: ally.link_url,
      },
      sort_order: ally.sort_order,
      sequence: candidates.length,
      native: false,
    })
  }

  const unique: Candidate[] = []
  for (const candidate of candidates) {
    const index = unique.findIndex((existing) => sameEntity(existing.item, candidate.item))
    if (index === -1) {
      unique.push(candidate)
    } else if (candidate.native && !unique[index]?.native) {
      unique[index] = candidate
    }
  }

  return unique
    .sort((left, right) => left.sort_order - right.sort_order || left.sequence - right.sequence)
    .map(({ item }) => item)
}

function nativeSource(item: CommunityLogo, index: number): MarqueeSource {
  return {
    id: item.id,
    name: item.name,
    logo_url: item.logo_url,
    website: item.website,
    instagram: item.instagram,
    sort_order: item.sort_order ?? index,
  }
}

export function runningCrewMarqueeItems(
  groups: CommunityLogo[],
  allies: HomeLogoCarouselItem[] = [],
): CommunityMarqueeItem[] {
  return mergeItems(groups.map(nativeSource), allies, 'show_in_running_crews')
}

export function organizationMarqueeItems(
  brands: CommunityLogo[],
  allies: HomeLogoCarouselItem[] = [],
): CommunityMarqueeItem[] {
  return mergeItems(
    brands
      .filter((brand) => brand.type === 'organizer')
      .map(nativeSource),
    allies,
    'show_in_organizations',
  )
}
