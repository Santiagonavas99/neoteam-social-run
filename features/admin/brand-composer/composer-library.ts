import type { CommunityRecord, LogoItem } from '../types'

export type ComposerBrand = {
  id: string
  name: string
  src: string
  origin: 'brands' | 'logos'
}

function normalizedName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es')
}

function hasImage(value: string | null | undefined): value is string {
  if (!value?.trim()) return false
  // An invalid relative path such as /neoteam-logo.png cannot be drawn by Canvas
  // unless it actually exists. Stored partner logos use full public Storage URLs.
  return /^(https?:\/\/|blob:|data:image\/)/i.test(value.trim())
}

/**
 * The Home's "Marcas aliadas" marquee uses ALL active home_logo_carousel_items,
 * independently of show_in_organizations. That flag only opts into a different
 * Home strip, so it must NEVER filter this library.
 *
 * Prioritize the marquee's canonical logos over duplicate brand records.
 * Exclude organizers (NeoTeam), which are not allied sponsor marks.
 */
export function composerBrands(brands: CommunityRecord[], logos: LogoItem[]): ComposerBrand[] {
  const items: ComposerBrand[] = []
  const names = new Set<string>()
  const sortedLogos = logos
    .filter((item) => item.active && hasImage(item.logo_url))
    .sort((a, b) => a.sort_order - b.sort_order)
  const sortedBrands = brands
    .filter(
      (item) =>
        item.active && item.show_on_home && item.type !== 'organizer' && hasImage(item.logo_url),
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  for (const logo of sortedLogos) {
    const name = normalizedName(logo.name)
    if (!name || names.has(name)) continue
    names.add(name)
    items.push({ id: `logo:${logo.id}`, name: logo.name, src: logo.logo_url, origin: 'logos' })
  }
  for (const brand of sortedBrands) {
    const name = normalizedName(brand.name)
    if (!name || names.has(name) || !brand.logo_url) continue
    names.add(name)
    items.push({ id: `brand:${brand.id}`, name: brand.name, src: brand.logo_url, origin: 'brands' })
  }
  return items
}

/** Maps only known, public Supabase images through Next's same-origin image optimizer. */
export function composerImageSrc(src: string) {
  const prefix = 'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/'
  if (src.startsWith(prefix)) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`
  }
  return src
}
