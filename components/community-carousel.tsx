import Image from 'next/image'
import type { CommunityLogo } from '@/lib/home-features'
import { HorizontalCarousel } from './horizontal-carousel'

function externalUrl(value?: string | null) {
  if (!value?.trim()) return undefined
  try {
    const url = new URL(
      /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`,
    )
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

function logoLink(item: CommunityLogo) {
  const website = externalUrl(item.website)
  if (website) return website
  const instagram = item.instagram?.trim()
  if (!instagram) return undefined
  if (/^(https?:\/\/)?(www\.)?instagram\.com\//i.test(instagram)) return externalUrl(instagram)
  const handle = instagram.replace(/^@/, '')
  return /^[\w.]+$/.test(handle) ? `https://www.instagram.com/${handle}/` : undefined
}

export function CommunityCarousel({
  items,
  title,
  description,
}: {
  items: CommunityLogo[]
  title: string
  description: string
}) {
  if (!items.length) return null
  return (
    <section className="logo-panel" aria-label={title}>
      <h3>{title}</h3>
      <HorizontalCarousel ariaLabel={title} className="logo-carousel">
        {items.map((item) => {
          const href = logoLink(item)
          const content = item.logo_url ? (
            <Image unoptimized src={item.logo_url} width={180} height={80} alt={item.name} />
          ) : (
            <strong>{item.name}</strong>
          )
          return href ? (
            <a
              className="community-logo"
              key={item.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.name} (abre en una nueva pestaña)`}
            >
              {content}
            </a>
          ) : (
            <div className="community-logo" key={item.id}>
              {content}
            </div>
          )
        })}
      </HorizontalCarousel>
      <small>{description}</small>
    </section>
  )
}
