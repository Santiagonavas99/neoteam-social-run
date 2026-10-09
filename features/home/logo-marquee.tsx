import Image from 'next/image'
import { isOptimizable } from './logo-image'

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

export type LogoMarqueeItem = {
  id: string
  name: string
  logo_url: string | null
  link_url?: string | null
  website?: string | null
  instagram?: string | null
}

function instagramUrl(value?: string | null) {
  const instagram = value?.trim()
  if (!instagram) return undefined
  if (/^(https?:\/\/)?(www\.)?instagram\.com\//i.test(instagram)) return externalUrl(instagram)
  const handle = instagram.replace(/^@/, '')
  return /^[\w.]+$/.test(handle) ? `https://www.instagram.com/${handle}/` : undefined
}

function itemUrl(item: LogoMarqueeItem) {
  return externalUrl(item.link_url) || externalUrl(item.website) || instagramUrl(item.instagram)
}

function logoContent(item: LogoMarqueeItem, hidden: boolean) {
  const logoUrl = item.logo_url?.trim()
  return logoUrl && /^https?:\/\//i.test(logoUrl) ? (
    <Image
      unoptimized={!isOptimizable(logoUrl)}
      src={logoUrl}
      width={200}
      height={112}
      alt={hidden ? '' : item.name}
      className="size-full object-contain"
    />
  ) : (
    <span className="px-2 text-center text-sm font-bold leading-tight text-neo-black md:text-base">
      {item.name}
    </span>
  )
}

// Tiles stay white in both themes: most partner logos are dark marks drawn for a light background.
const tileClass =
  'flex h-22 w-37 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-neo-border bg-neo-white p-2 transition-transform duration-300 hover:-translate-y-0.5 md:h-28 md:w-50 md:p-3'

export function LogoMarquee({
  items,
  title = 'Marcas aliadas',
}: {
  items: LogoMarqueeItem[]
  title?: string
}) {
  const visibleItems = items.filter((item) => item.name.trim())
  if (!visibleItems.length) return null

  const titleId = `logo-strip-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title`

  const shouldAnimate = visibleItems.length > 1
  const repeatCount = shouldAnimate ? Math.max(1, Math.ceil(8 / visibleItems.length)) : 1
  const repeatedItems = Array.from({ length: repeatCount }, () => visibleItems).flat()
  const linked = visibleItems.some((item) => itemUrl(item))

  function group(hidden = false) {
    return (
      <div className="flex shrink-0 gap-3 pr-3 md:gap-4 md:pr-4" aria-hidden={hidden || undefined}>
        {repeatedItems.map((item, index) => {
          const href = itemUrl(item)
          const image = logoContent(item, hidden)

          return href ? (
            <a
              className={tileClass}
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
            <div className={tileClass} key={`${item.id}-${index}`}>
              {image}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section aria-labelledby={titleId} className="bg-neo-bg py-8 md:py-12">
      <div className="shell reveal mb-4 flex items-baseline justify-between gap-3">
        <h2
          id={titleId}
          className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-neo-accent-text"
        >
          {title}
        </h2>
        {linked && (
          <p className="logo-marquee-link-hint m-0 text-[13px] text-neo-text-secondary">
            Toca una tarjeta para conocer más
          </p>
        )}
        {shouldAnimate && (
          <p className="logo-marquee-swipe-hint m-0 text-[13px] text-neo-text-secondary">
            Desliza para ver más
          </p>
        )}
      </div>
      <div className="logo-marquee-viewport reveal overflow-hidden py-2">
        <div
          className={
            shouldAnimate
              ? 'logo-marquee-track flex w-max'
              : 'flex w-full justify-center'
          }
          style={{ animationDuration: `${repeatedItems.length * 5}s` }}
        >
          {group(false)}
          {shouldAnimate && group(true)}
        </div>
      </div>
    </section>
  )
}
