import { ArrowLeft, ArrowUpRight, CalendarDays, type LucideIcon, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandLink } from '@/components/brand-link'
import { eventConfig } from '@/features/event/event'
import { mapsUrl } from '@/features/event/maps'
import { linkClass } from './form-ui'

type Fact = { icon: LucideIcon; label: string; value: string; href?: string }

export const eventFacts: Fact[] = [
  { icon: CalendarDays, label: 'Fecha', value: eventConfig.dateLabel },
  {
    icon: MapPin,
    label: 'Punto',
    value: eventConfig.location,
    href: mapsUrl(eventConfig.location),
  },
]

export function RegistrationShell({
  title,
  intro,
  facts,
  aside,
  children,
}: {
  title: [string, string]
  intro: string
  facts: Fact[]
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-neo-bg">
      <header className="mx-auto w-full max-w-[1336px] px-5 md:px-12">
        <div className="flex h-18 items-center justify-between gap-3 border-b border-neo-border md:h-20 md:gap-6">
          <BrandLink />
          <Link href="/" className={linkClass}>
            <ArrowLeft aria-hidden className="size-4 shrink-0" />
            Volver al evento
          </Link>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-170 items-start gap-6 px-5 pt-6 pb-20 md:max-w-[1336px] md:grid-cols-[0.75fr_1.25fr] md:gap-8 md:px-12 md:pt-12 lg:gap-16">
        <aside className="md:sticky md:top-8 md:py-8">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-neo-accent-text">
            Social Run · {eventConfig.dateShort}
          </p>
          <h1 className="my-4 text-[40px] uppercase sm:text-5xl leading-[0.94] font-bold tracking-[-0.06em] md:my-6 md:text-[clamp(50px,5.5vw,80px)]">
            <span className="md:block">{title[0]}</span>{' '}
            <span className="md:block">{title[1]}</span>
          </h1>
          <p className="mb-4 text-[15px] text-neo-text-secondary md:mb-8 md:max-w-85">{intro}</p>
          <dl className="m-0 md:max-w-85">
            {facts.map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="grid grid-cols-[88px_1fr] items-baseline gap-3 border-t border-neo-border py-2.5 md:flex md:flex-col md:gap-2 md:py-4"
              >
                <dt className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.13em] text-neo-accent-text">
                  <Icon aria-hidden className="size-3.5 shrink-0" />
                  {label}
                </dt>
                <dd className="m-0 text-sm font-medium">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex min-h-11 items-center gap-1.5 underline decoration-neo-accent underline-offset-4 md:min-h-0"
                    >
                      {value}
                      <ArrowUpRight aria-hidden className="size-4 shrink-0" />
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {aside}
        </aside>
        {children}
      </div>
    </main>
  )
}
