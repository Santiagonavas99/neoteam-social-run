import type { CommunityRecord, LogoItem } from '../types'

export type ComposerBrand = {
  id: string
  name: string
  src: string
  origin: 'brands' | 'logos'
}

function normalizedName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es')
}

/** Source of truth is the existing admin library, including the Home logo carousel. */
export function composerBrands(
  brands: CommunityRecord[],
  logos: LogoItem[],
): ComposerBrand[] {
  const items: ComposerBrand[] = []
  const names = new Set<string>()
  const sortedBrands = brands.filter((item) => item.active && item.show_on_home && item.logo_url)
    .sort((a, b) => a.sort_order - b.sort_order)
  const sortedLogos = logos.filter((item) =>
    item.active && item.show_in_organizations && Boolean(item.logo_url),
  ).sort((a, b) => a.sort_order - b.sort_order)

  for (const brand of sortedBrands) {
    const name = normalizedName(brand.name)
    if (!name || names.has(name)) continue
    names.add(name)
    if (!brand.logo_url) continue
    items.push({ id: `brand:${brand.id}`, name: brand.name, src: brand.logo_url, origin: 'brands' })
  }
  for (const logo of sortedLogos) {
    const name = normalizedName(logo.name)
    if (!name || names.has(name)) continue
    names.add(name)
    items.push({ id: `logo:${logo.id}`, name: logo.name, src: logo.logo_url, origin: 'logos' })
  }
  return items
}

/** Maps only known, public Supabase images through Next's same-origin image optimizer. */
export function composerImageSrc(src: string) {
  const prefix = 'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/'
  if (src.startsWith(prefix)) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=80`
  }
  return src
}
