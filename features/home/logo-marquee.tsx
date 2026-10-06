import Image from 'next/image'
import type { HomeLogoCarouselItem } from '@/features/home/data'

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
    <Image
      unoptimized
      src={item.logo_url}
      width={200}
      height={112}
      alt={hidden ? '' : item.name}
      className="size-full object-contain"
    />
  )
}

// Tiles stay white in both themes: most partner logos are dark marks drawn for a light background.
const tileClass =
  'flex h-22 w-37 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-neo-border bg-neo-white p-2 transition-transform duration-300 hover:-translate-y-0.5 md:h-28 md:w-50 md:p-3'

export function LogoMarquee({ items }: { items: HomeLogoCarouselItem[] }) {
  const visibleItems = items.filter((item) => item.logo_url?.trim())
  if (!visibleItems.length) return null

  const repeatCount = Math.max(1, Math.ceil(8 / visibleItems.length))
  const repeatedItems = Array.from({ length: repeatCount }, () => visibleItems).flat()
  const linked = visibleItems.some((item) => externalUrl(item.link_url))

  function group(hidden = false) {
    return (
      <div className="flex shrink-0 gap-3 pr-3 md:gap-4 md:pr-4" aria-hidden={hidden || undefined}>
        {repeatedItems.map((item, index) => {
          const href = externalUrl(item.link_url)
          const image = logoImage(item, hidden)

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
    <section aria-labelledby="brand-strip-title" className="bg-neo-bg py-8 md:py-12">
      <div className="shell mb-4 flex items-baseline justify-between gap-3">
        <h2
          id="brand-strip-title"
          className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-neo-accent-text"
        >
          Marcas aliadas
        </h2>
        {linked && (
          <p className="m-0 text-[13px] text-neo-text-secondary">Toca un logo para visitarla</p>
        )}
      </div>
      <div className="group overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto">
        <div
          className="flex w-max animate-marquee group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ animationDuration: `${repeatedItems.length * 5}s` }}
        >
          {group(false)}
          {group(true)}
        </div>
      </div>
    </section>
  )
}
