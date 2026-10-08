import { ArrowUpRight, MessageCircle } from 'lucide-react'
import { InstagramIcon } from '@/components/instagram-icon'
import { communityLinks } from '@/features/event/community-links'

// The community is separate from both the QR ticket and the success/recovery card.
export function CommunityConnect() {
  return (
    <section
      aria-labelledby="community-connect-heading"
      className="mx-auto mt-9 w-full max-w-90 text-left"
    >
      <p className="m-0 text-xs font-bold tracking-[0.14em] text-neo-accent-text uppercase">
        SIGAMOS CONECTADOS
      </p>
      <h2
        id="community-connect-heading"
        className="m-0 mt-2 text-xl font-bold tracking-[-0.04em] text-neo-text"
      >
        La comunidad sigue corriendo.
      </h2>
      <p className="m-0 mt-2 text-sm leading-normal text-neo-text-secondary">
        Súmate al grupo y acompáñanos también en Instagram.
      </p>
      <div className="mt-5 grid gap-3">
        <a
          href={communityLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-neo-accent px-4 py-3 text-sm font-bold text-neo-black transition-transform active:scale-[0.98]"
        >
          <MessageCircle aria-hidden className="size-4 shrink-0" />
          Unirme al WhatsApp
          <ArrowUpRight aria-hidden className="size-4 shrink-0" />
        </a>
        <a
          href={communityLinks.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-neo-border bg-neo-surface px-4 py-3 text-sm font-semibold text-neo-text transition-transform active:scale-[0.98]"
        >
          <InstagramIcon aria-hidden className="size-4 shrink-0" />
          Seguir @neoteam_cali
          <ArrowUpRight aria-hidden className="size-4 shrink-0" />
        </a>
      </div>
    </section>
  )
}
