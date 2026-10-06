export type Resource = 'participants' | 'groups' | 'brands'

export type Participant = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  document_type: string
  document_number: string
  registration_code?: string
  registration_number?: number
  running_groups?: { name: string } | null
  other_running_group?: string | null
  shirt_size?: string | null
  status: string
  checked_in_at?: string | null
}

// Running groups and brands share one table shape and one form; brands add type and website.
export type CommunityRecord = {
  id: string
  name: string
  slug?: string
  logo_url?: string | null
  instagram?: string | null
  website?: string | null
  type?: string
  invited?: boolean
  active: boolean
  show_on_home: boolean
  sort_order: number
}

export type LogoItem = {
  id: string
  name: string
  logo_url: string
  link_url?: string | null
  active: boolean
  sort_order: number
}

export type Metrics = {
  registered: number
  checkedIn: number
  groups: number
  brands: number
  dynamics: number
}

export type DynamicType =
  | 'raffle'
  | 'qr'
  | 'checkpoint'
  | 'challenge'
  | 'trivia'
  | 'mission'
  | 'voting'
  | 'instant_win'
  | 'points'

export type DynamicStatus = 'draft' | 'open' | 'closed' | 'completed' | 'cancelled'

export type DynamicRow = {
  id: string
  name: string
  description?: string | null
  type: DynamicType
  status: DynamicStatus
  sponsor_brand_id?: string | null
  points: number
  requires_checkin: boolean
  prize?: string | null
  winner_count: number
  eligibility_dynamic_id?: string | null
  config?: Record<string, unknown>
  participations_count?: number
  winners_count?: number
}

export type ScannedParticipant = {
  id: string
  code: string
  firstName: string
  lastName: string
  status: string
  group: string
  checkedInAt: string | null
}

export type CheckinResult = 'checkedIn' | 'alreadyCheckedIn' | 'cancelled'

export type StaffRole = 'admin' | 'checkin'

export type StaffUser = {
  id: string
  name: string
  username: string
  role: StaffRole
  active: boolean
  /** Only sent when creating a user or resetting their PIN; never returned. */
  pin?: string
}

export type AdminResponse<Row = unknown> = {
  ok?: boolean
  role?: StaffRole
  name?: string
  configured?: boolean
  setupSecretReady?: boolean
  valid?: boolean
  token?: string
  expiresAt?: string
  rows?: Row[]
  metrics?: Metrics
  url?: string
  error?: string
  winners?: number
  deleted?: number
  result?: CheckinResult
  participant?: ScannedParticipant
  dynamicRows?: DynamicRow[]
  winnerDetails?: ScannedParticipant[]
  alreadyCompleted?: boolean
  won?: boolean
  prize?: string | null
}

export type FeedbackValue = { kind: 'success' | 'error'; text: string } | null

export const isNew = (row: { id: string }) => row.id.startsWith('new-')
