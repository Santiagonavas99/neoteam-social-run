import type { HomeFeatureCard } from '@/lib/home-features'

export type AdminSection =
  | 'metrics'
  | 'home'
  | 'logos'
  | 'participants'
  | 'groups'
  | 'brands'
  | 'raffles'
  | 'security'
export type Resource = 'participants' | 'groups' | 'brands' | 'raffles'
export type AdminRow = {
  id: string
  name?: string
  slug?: string
  logo_url?: string | null
  instagram?: string | null
  website?: string | null
  type?: string
  active?: boolean
  show_on_home?: boolean
  sort_order?: number
  invited?: boolean
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  document_type?: string
  document_number?: string
  registration_code?: string
  registration_number?: number
  running_groups?: { name: string } | null
  other_running_group?: string | null
  shirt_size?: string | null
  status?: string
  checked_in_at?: string | null
  prize?: string
  description?: string
  winner_count?: number
  requires_checkin?: boolean
  sponsor_brand_id?: string | null
  draw_at?: string | null
}
export type Metrics = {
  registered: number
  checkedIn: number
  groups: number
  brands: number
  raffles: number
}
export type AdminResponse = {
  ok?: boolean
  configured?: boolean
  setupSecretReady?: boolean
  valid?: boolean
  token?: string
  expiresAt?: string
  cards?: HomeFeatureCard[]
  rows?: AdminRow[]
  metrics?: Metrics
  url?: string
  error?: string
  winners?: number
}
export type AdminApi = (action: string, payload?: Record<string, unknown>) => Promise<AdminResponse>
export type FeedbackValue = { kind: 'success' | 'error'; text: string } | null
export const participantStates: Record<string, string> = {
  registered: 'Inscrito',
  checked_in: 'Check-in',
  no_show: 'No asistió',
  cancelled: 'Cancelado',
}
export const raffleStates: Record<string, string> = {
  draft: 'Borrador',
  open: 'Abierta',
  drawn: 'Sorteada',
  cancelled: 'Cancelada',
}
export const brandTypes: Record<string, string> = {
  organizer: 'Organizador',
  main_partner: 'Aliado principal',
  sponsor: 'Patrocinador',
  invited: 'Invitado',
}
