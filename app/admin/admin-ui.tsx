import {
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleSlash,
  CircleX,
  Flag,
  GalleryHorizontal,
  Gift,
  House,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  Tag,
  Trophy,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import type { AdminSection, FeedbackValue } from './admin-types'

export const sectionIcons: Record<AdminSection, LucideIcon> = {
  metrics: LayoutDashboard,
  home: House,
  logos: GalleryHorizontal,
  participants: Users,
  groups: Flag,
  brands: Tag,
  raffles: Gift,
  security: ShieldCheck,
}

const statusIcons: Record<string, LucideIcon> = {
  registered: Circle,
  checked_in: CircleCheck,
  no_show: CircleSlash,
  cancelled: CircleX,
  draft: CircleDashed,
  open: CircleDot,
  drawn: Trophy,
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
    <span className={`status-badge status-${status}`}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {label}
    </span>
  )
}
export function Logo({ url, name }: { url?: string | null; name: string }) {
  return (
    <span className="record-logo">
      {url ? (
        <Image unoptimized src={url} width={64} height={64} alt={`Logo de ${name}`} />
      ) : (
        <span aria-hidden="true">{name.slice(0, 2).toUpperCase() || 'N'}</span>
      )}
    </span>
  )
}
