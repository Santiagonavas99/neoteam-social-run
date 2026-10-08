import type { CommunityRecord } from '../types'

const STORAGE_ORIGIN = 'https://ohatsnkgaeccltqwhkbv.supabase.co'
const STORAGE_PATH = /^\/storage\/v1\/object\/public\/admin-media\/[^/]+\.(?:png|jpe?g)$/i

export function isExistingStoredImage(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (
      parsed.origin === STORAGE_ORIGIN &&
      STORAGE_PATH.test(parsed.pathname) &&
      !parsed.search &&
      !parsed.hash
    )
  } catch {
    return false
  }
}

// adminData.save always rebuilds group/brand slugs from names. Never change registration slugs.
export function expectedSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

export function canPreserveSlug(record: CommunityRecord): boolean {
  return typeof record.slug === 'string' && record.slug === expectedSlug(record.name)
}

/** Hidden in Preview and whenever there are no legacy image references left. */
export function canOfferLegacyWebpMigration(
  production: boolean,
  remaining: number | null,
): boolean {
  return production && remaining !== null && remaining > 0
}
