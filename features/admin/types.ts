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
  birth_date?: string | null
  running_group_id?: string | null
  emergency_name?: string
  emergency_phone?: string
  created_at?: string
  updated_at?: string
  pass_emailed_at?: string | null
  running_groups?: { name: string } | null
  other_running_group?: string | null
  shirt_size?: string | null
  gender?: string | null
  status: string
  checked_in_at?: string | null
}

// Running groups and brands share one table shape and one form; brands add type and website.
export type ParticipantGroupOption = { id: string; name: string; active: boolean }

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
  show_in_running_crews: boolean
  show_in_organizations: boolean
}

export type ParticipantStatusCounts = {
  registered: number
  checked_in: number
  no_show: number
  cancelled: number
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

export type RankedRunner = ScannedParticipant & { points: number }

export type CheckinResult = 'checkedIn' | 'alreadyCheckedIn' | 'cancelled'

export type StaffRole = 'admin' | 'checkin'

export type StaffUser = {
  id: string
  name: string
  email: string
  role: StaffRole
  active: boolean
}

export type AdminResponse<Row = unknown> = {
  ok?: boolean
  role?: StaffRole
  name?: string
  valid?: boolean
  expiresAt?: string
  deadline?: string | null
  registrationOpen?: boolean
  rows?: Row[]
  metrics?: Metrics
  url?: string
  error?: string
  winners?: number
  count?: number
  pending?: number
  sent?: number
  failed?: number
  reason?: string
  page?: number
  pageSize?: number
  statusCounts?: ParticipantStatusCounts
  deleted?: number
  result?: CheckinResult
  queueResult?: 'sent' | 'skipped' | 'failed'
  emailChanged?: boolean
  unchanged?: boolean
  participant?: ScannedParticipant
  dynamicRows?: DynamicRow[]
  winnerDetails?: ScannedParticipant[]
  ranking?: RankedRunner[]
  alreadyCompleted?: boolean
  won?: boolean
  prize?: string | null
}

export type FeedbackValue = { kind: 'success' | 'error'; text: string } | null

export const isNew = (row: { id: string }) => row.id.startsWith('new-')
