import {
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleSlash,
  CircleStop,
  CircleX,
  type LucideIcon,
  Trophy,
} from 'lucide-react'
import Image from 'next/image'
import type { FeedbackValue } from '../types'

const statusIcons: Record<string, LucideIcon> = {
  registered: Circle,
  checked_in: CircleCheck,
  no_show: CircleSlash,
  cancelled: CircleX,
  draft: CircleDashed,
  open: CircleDot,
  drawn: Trophy,
  closed: CircleStop,
  completed: Trophy,
}

export function Feedback({ value }: { value: FeedbackValue }) {
  if (!value) return null
  const Icon = value.kind === 'error' ? CircleAlert : CircleCheck
  return (
    <p
      className={`feedback feedback-${value.kind} flex items-start gap-2`}
      role={value.kind === 'error' ? 'alert' : 'status'}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      {value.text}
    </p>
  )
}
const badgeTones: Record<string, string> = {
  checked_in: 'bg-neo-accent-soft text-neo-accent-text',
  open: 'bg-neo-accent-soft text-neo-accent-text',
  drawn: 'bg-neo-accent-soft text-neo-accent-text',
  completed: 'bg-neo-accent-soft text-neo-accent-text',
  cancelled: 'bg-neo-danger-bg text-neo-danger',
  no_show: 'bg-neo-warning-bg text-neo-warning',
}

export function StatusBadge({
  status,
  label,
  icon,
}: {
  status: string
  label: string
  icon?: LucideIcon
}) {
  const Icon = icon ?? statusIcons[status] ?? Circle
  return (
    <span
      className={`inline-flex w-max max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold leading-snug ${
        badgeTones[status] ?? 'bg-neo-muted-bg text-neo-text-secondary'
      }`}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {label}
    </span>
  )
}
export function Logo({ url, name }: { url?: string | null; name: string }) {
  return (
    // Logos keep a white tile in both themes: most are dark marks on transparent PNGs.
    <span className="grid size-13 shrink-0 place-items-center overflow-hidden rounded-control border border-neo-border bg-neo-white md:size-16">
      {url ? (
        <Image
          unoptimized
          src={url}
          width={64}
          height={64}
          alt={`Logo de ${name}`}
          className="size-full object-contain p-2"
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-[22px] font-semibold tracking-[-0.06em] text-neo-accent-dark"
        >
          {name.slice(0, 2).toUpperCase() || 'N'}
        </span>
      )}
    </span>
  )
}
