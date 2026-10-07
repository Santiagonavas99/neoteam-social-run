import { CalendarPlus } from 'lucide-react'
import { passFacts } from '@/features/event/pass-facts'

const eventSummary = passFacts.map(({ value }) => value).join(' · ')

// Apple gets the same-site .ics (the Calendar sheet); Google Calendar opens in a new tab.
export function CalendarButton({ href }: { href: string }) {
  const external = href.startsWith('https://')
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className="flex min-h-16 w-full items-center gap-4 rounded-card border border-neo-accent bg-neo-accent p-3 pr-5 text-left text-neo-black transition-colors hover:border-neo-accent-hover hover:bg-neo-accent-hover"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-control bg-neo-black text-neo-accent">
        <CalendarPlus aria-hidden className="size-5" />
      </span>
      <span className="grid gap-0.5">
        <span className="text-base font-bold">Agregar a mi agenda</span>
        <span className="text-xs font-medium">{eventSummary}</span>
      </span>
    </a>
  )
}
