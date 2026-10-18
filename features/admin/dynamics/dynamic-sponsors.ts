import type { CommunityRecord, DynamicRow, LogoItem } from '../types'

export type DynamicSponsor = { value: string; name: string }

function normalizedName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es')
}

/** Prefer canonical allied logos and preserve older brand references. */
export function dynamicSponsorOptions(
  brands: CommunityRecord[],
  logos: LogoItem[],
  selectedValue = '',
): DynamicSponsor[] {
  const options: DynamicSponsor[] = []
  const names = new Set<string>()
  for (const logo of [...logos].sort((a, b) => a.sort_order - b.sort_order)) {
    if (!logo.active) continue
    const name = normalizedName(logo.name)
    if (!name || names.has(name)) continue
    names.add(name)
    options.push({ value: `logo:${logo.id}`, name: logo.name })
  }
  for (const brand of [...brands].sort((a, b) => a.sort_order - b.sort_order)) {
    const value = `brand:${brand.id}`
    const selected = selectedValue === value
    if ((!brand.active || brand.type === 'organizer') && !selected) continue
    const name = normalizedName(brand.name)
    if (!name || (names.has(name) && !selected)) continue
    names.add(name)
    options.push({ value, name: brand.name })
  }
  if (selectedValue && !options.some((item) => item.value === selectedValue)) {
    options.push({ value: selectedValue, name: 'Marca anterior (ya no disponible)' })
  }
  return options
}

export function dynamicSponsorValue(row: Pick<DynamicRow, 'sponsor_brand_id' | 'config'>): string {
  const logoId = row.config?.sponsor_logo_id
  if (typeof logoId === 'string' && logoId) return `logo:${logoId}`
  return row.sponsor_brand_id ? `brand:${row.sponsor_brand_id}` : ''
}

/** Legacy sponsor_brand_id is an FK to brands, never to home_logo_carousel_items. */
export function sponsorFields(
  selection: string,
  currentConfig: Record<string, unknown> = {},
): Pick<DynamicRow, 'sponsor_brand_id' | 'config'> {
  const config = { ...currentConfig }
  delete config.sponsor_logo_id
  if (selection.startsWith('logo:') && selection.length > 5) {
    return { sponsor_brand_id: null, config: { ...config, sponsor_logo_id: selection.slice(5) } }
  }
  return {
    sponsor_brand_id:
      selection.startsWith('brand:') && selection.length > 6 ? selection.slice(6) : null,
    config,
  }
}
