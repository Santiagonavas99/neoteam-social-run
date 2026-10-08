import { CalendarDays, Clock, ImageDown, MapPin } from 'lucide-react'
import Image from 'next/image'
import { NeoTeamLogo } from '@/components/neoteam-logo'
import { passFacts } from '@/features/event/pass-facts'
import { CalendarButton } from './calendar-button'
import googleWalletButton from './google-wallet-button.svg'
import type { Pass } from './pass'

const factIcons = { date: CalendarDays, arrival: Clock, place: MapPin }
const pinHoles = ['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3']
const notch = 'absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-neo-surface'

// A race bib: always black, like the hero, so it reads the same in both themes.
export function PassCard({ pass }: { pass: Pass }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 text-center">
      <CalendarButton href={pass.calendarUrl} />
      <article
        aria-label={`Pase ${pass.code}`}
        className="relative w-full max-w-90 overflow-clip rounded-card bg-neo-black text-neo-white [--neo-brand-cyan:var(--neo-accent)]"
      >
        {pinHoles.map((place) => (
          <span
            key={place}
            aria-hidden
            className={`absolute size-2.5 rounded-full bg-neo-surface ${place}`}
          />
        ))}
        <div className="px-3 pt-7 pb-4">
          <NeoTeamLogo className="mx-auto h-7 w-auto" />
          <p className="m-0 mt-3 text-xs font-bold tracking-[0.14em] text-balance text-neo-accent">
            ANIVERSARIO NEOTEAM · SOCIAL RUN
          </p>
          <p className="m-0 mt-4 text-[clamp(32px,11vw,44px)] leading-none font-extrabold tracking-[-0.04em] whitespace-nowrap">
            {pass.code}
          </p>
          {pass.name ? (
            <p className="m-0 mt-2 text-lg font-bold text-neo-on-dark-secondary">{pass.name}</p>
          ) : null}
          {/* biome-ignore lint/performance/noImgElement: a data URL gains nothing from next/image */}
          <img
            src={pass.qr}
            alt={`Código QR de check-in ${pass.code}`}
            width={320}
            height={320}
            className="mx-auto mt-5 block aspect-square h-auto w-full max-w-80 rounded-control bg-neo-white"
          />
        </div>
        <div
          aria-hidden
          className="relative mx-5 border-t-2 border-dashed border-neo-on-dark-border"
        >
          <span className={`${notch} -left-7.5`} />
          <span className={`${notch} -right-7.5`} />
        </div>
        <dl className="m-0 grid grid-cols-3 gap-3 px-5 pt-4 pb-7 text-left max-[359px]:grid-cols-1">
          {passFacts.map(({ id, label, value }) => {
            const Icon = factIcons[id]
            return (
              <div key={id}>
                <dt className="inline-flex items-center gap-1 text-xs font-bold tracking-[0.12em] text-neo-accent uppercase">
                  <Icon aria-hidden className="size-3.5 shrink-0" />
                  {label}
                </dt>
                <dd className="m-0 mt-1 text-sm font-medium text-neo-on-dark-secondary">{value}</dd>
              </div>
            )
          })}
        </dl>
      </article>
      {pass.googleWalletUrl ? (
        <a href={pass.googleWalletUrl} className="mt-2 inline-flex rounded-full">
          {/* Google's official badge, unchanged, per the Wallet brand guidelines. */}
          <Image src={googleWalletButton} alt="Agregar a la Billetera de Google" unoptimized />
        </a>
      ) : null}
      {pass.imageUrl ? (
        <a
          href={pass.imageUrl}
          target="_blank"
          rel="noopener"
          className="button mt-2 w-full md:max-w-80"
        >
          <ImageDown aria-hidden className="size-4 shrink-0" />
          Guardar pase en Fotos
        </a>
      ) : null}
      <p className="m-0 text-sm leading-normal text-neo-text-secondary">
        Toma una captura de pantalla: es tu entrada para el check-in.
      </p>
    </div>
  )
}
