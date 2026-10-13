import { unstable_cache } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  defaultHomeSectionOrder,
  type HomeSectionOrder,
  normalizeHomeSectionOrder,
} from './section-order'

// Supabase errors are plain objects, so logging them whole prints "{}".
const errorText = (error: unknown) =>
  typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : error

export type HomeLogoCarouselKind = 'brand' | 'race'

export type HomeLogoCarouselItem = {
  id: string
  name: string
  logo_url: string
  link_url: string | null
  active: boolean
  sort_order: number
  show_in_races: boolean
  show_in_running_crews: boolean
  show_in_organizations: boolean
}

export async function getHomeLogoCarouselItems(
  kind: HomeLogoCarouselKind = 'brand',
): Promise<HomeLogoCarouselItem[]> {
  try {
    const supabase = createServerSupabaseClient()
    const baseColumns = 'id,name,logo_url,link_url,active,sort_order'
    const query = (columns: string, filterKind = true) => {
      const request = supabase
        .from('home_logo_carousel_items')
        .select(columns)
        .eq('event_code', 'SR26')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      return filterKind ? request.eq('carousel_kind', kind) : request
    }

    const columns = `${baseColumns},show_in_races,show_in_running_crews,show_in_organizations`
    let { data, error } = await query(columns)
    let filterKind = true

    // Preserve the existing brands while the new carousel migration is pending.
    // Races must never fall back to the brand list.
    if (
      error &&
      ['42703', 'PGRST204'].includes(error.code) &&
      /carousel_kind/.test(error.message)
    ) {
      if (kind === 'race') return []
      filterKind = false
      const fallback = await query(columns, false)
      data = fallback.data
      error = fallback.error
    }

    // Keep existing allies visible while the optional reuse migration is pending.
    if (
      error &&
      ['42703', 'PGRST204'].includes(error.code) &&
      /show_in_races|show_in_running_crews|show_in_organizations/.test(error.message)
    ) {
      const fallback = await query(baseColumns, filterKind)
      data = fallback.data
      error = fallback.error
    }

    if (error) throw error
    return ((data ?? []) as unknown as HomeLogoCarouselItem[]).map((item) => ({
      ...item,
      show_in_races: item.show_in_races === true,
      show_in_running_crews: item.show_in_running_crews === true,
      show_in_organizations: item.show_in_organizations === true,
    }))
  } catch (error) {
    console.error('Home logo carousel fallback', errorText(error))
    return []
  }
}

export type CommunityLogo = {
  id: string
  name: string
  logo_url: string | null
  type?: string
  instagram?: string | null
  website?: string | null
  sort_order?: number
}

export async function getHomeCommunity() {
  try {
    const supabase = createServerSupabaseClient()
    const [groups, brands] = await Promise.all([
      supabase
        .from('running_groups')
        .select('id,name,logo_url,instagram,sort_order')
        .eq('active', true)
        .eq('show_on_home', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('brands')
        .select('id,name,logo_url,type,instagram,website,sort_order')
        .eq('active', true)
        .eq('show_on_home', true)
        .order('sort_order', { ascending: true }),
    ])
    if (groups.error) throw groups.error
    if (brands.error) throw brands.error
    return {
      groups: (groups.data ?? []) as CommunityLogo[],
      brands: (brands.data ?? []) as CommunityLogo[],
    }
  } catch (error) {
    console.error('Home community fallback', errorText(error))
    return { groups: [] as CommunityLogo[], brands: [] as CommunityLogo[] }
  }
}

export async function getHomeSectionOrder(): Promise<HomeSectionOrder[]> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('home_section_order')
      .select('section_key,sort_order,visible')
      .eq('event_code', 'SR26')
      .order('sort_order', { ascending: true })
      .order('section_key', { ascending: true })

    if (error) throw error
    return normalizeHomeSectionOrder(data ?? [])
  } catch (error) {
    console.error('Home section order fallback', errorText(error))
    return defaultHomeSectionOrder.map((section) => ({ ...section }))
  }
}

// Only the aggregate: registrations stay unreadable to the publishable key. Refreshed once a
// day; it throws on failure so an error is never cached.
const fetchRegisteredCount = unstable_cache(
  async () => {
    const { data, error } = await createServerSupabaseClient().rpc('social_run_registered_count')
    if (error) throw error
    return typeof data === 'number' ? data : null
  },
  ['registered-count'],
  { revalidate: 86_400 },
)

export async function getRegisteredCount(): Promise<number | null> {
  try {
    return await fetchRegisteredCount()
  } catch (error) {
    console.error('Registered count fallback', errorText(error))
    return null
  }
}
