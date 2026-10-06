import { createServerSupabaseClient } from '@/lib/supabase/server'

export type HomeLogoCarouselItem = {
  id: string
  name: string
  logo_url: string
  link_url: string | null
  sort_order: number
}

export async function getHomeLogoCarouselItems(): Promise<HomeLogoCarouselItem[]> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('home_logo_carousel_items')
      .select('id,name,logo_url,link_url,sort_order')
      .eq('event_code', 'SR26')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as HomeLogoCarouselItem[]
  } catch (error) {
    console.error('Home logo carousel fallback', error)
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
}

export async function getHomeCommunity() {
  try {
    const supabase = createServerSupabaseClient()
    const [groups, brands] = await Promise.all([
      supabase
        .from('running_groups')
        .select('id,name,logo_url,instagram')
        .eq('active', true)
        .eq('show_on_home', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('brands')
        .select('id,name,logo_url,type,instagram,website')
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
    console.error('Home community fallback', error)
    return { groups: [] as CommunityLogo[], brands: [] as CommunityLogo[] }
  }
}
