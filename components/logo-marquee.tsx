import Image from 'next/image'
import type { HomeLogoCarouselItem } from '@/lib/home-features'

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

function logoImage(item: HomeLogoCarouselItem, hidden: boolean) {
  return (
    <Image unoptimized src={item.logo_url} width={220} height={88} alt={hidden ? '' : item.name} />
  )
}

export function LogoMarquee({ items }: { items: HomeLogoCarouselItem[] }) {
  const visibleItems = items.filter((item) => item.logo_url?.trim())
  if (!visibleItems.length) return null

  const repeatCount = Math.max(1, Math.ceil(8 / visibleItems.length))
  const repeatedItems = Array.from({ length: repeatCount }, () => visibleItems).flat()

  function group(hidden = false) {
    return (
      <div className="brand-marquee-group" aria-hidden={hidden || undefined}>
        {repeatedItems.map((item, index) => {
          const href = externalUrl(item.link_url)
          const image = logoImage(item, hidden)

          return href ? (
            <a
              className="brand-marquee-item"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              // biome-ignore lint/suspicious/noArrayIndexKey: items repeat on purpose to fill the marquee
              key={`${item.id}-${index}`}
              tabIndex={hidden ? -1 : undefined}
              aria-label={hidden ? undefined : `${item.name} (abre en una nueva pestaña)`}
            >
              {image}
            </a>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: items repeat on purpose to fill the marquee
            <div className="brand-marquee-item" key={`${item.id}-${index}`}>
              {image}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section className="brand-marquee-section" aria-label="Marcas y aliados del Social Run">
      <div className="brand-marquee">
        <div className="brand-marquee-track">
          {group(false)}
          {group(true)}
        </div>
      </div>
    </section>
  )
}
