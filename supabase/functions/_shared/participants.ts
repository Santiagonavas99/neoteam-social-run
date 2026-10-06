// @ts-nocheck
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type ParticipantRow = {
  id: string
  registration_code: string
  first_name: string
  last_name: string
  status: string
  checked_in_at?: string | null
  other_running_group: string | null
  running_groups: { name: string } | null
}

export const participantFields =
  'id,registration_code,first_name,last_name,status,checked_in_at,other_running_group,running_groups(name)'

export function normalizeParticipantCode(value: unknown) {
  if (typeof value !== 'string') return ''
  let result = value.trim()
  if (result.toUpperCase().startsWith('NEOTEAM-SR26:'))
    result = result.slice('NEOTEAM-SR26:'.length).trim()
  return result
}

export function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

// A QR carries the check-in token; staff typing by hand use the SR26-xxxxx code.
export function participantLookup(value: string): [column: string, key: string] {
  return validUuid(value) ? ['checkin_token', value] : ['registration_code', value.toUpperCase()]
}

export function participantPayload(row: ParticipantRow) {
  return {
    id: row.id,
    code: row.registration_code,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    group: row.running_groups?.name || row.other_running_group || 'Independiente',
    checkedInAt: row.checked_in_at ?? null,
  }
}

export type CheckinOutcome =
  | { result: 'checkedIn' | 'alreadyCheckedIn' | 'cancelled'; participant: ParticipantRow }
  | { result: 'notFound' }

export async function checkInParticipant(
  supabase: SupabaseClient,
  eventId: string,
  value: string,
): Promise<CheckinOutcome> {
  const [column, key] = participantLookup(value)

  // The status filter makes the update the lock: two phones scanning at once check in only once.
  const { data: updated, error: updateError } = await supabase
    .from('registrations')
    .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq(column, key)
    .in('status', ['registered', 'no_show'])
    .select(participantFields)
    .maybeSingle()
  if (updateError) throw updateError
  if (updated) return { result: 'checkedIn', participant: updated }

  const { data: current, error: currentError } = await supabase
    .from('registrations')
    .select(participantFields)
    .eq('event_id', eventId)
    .eq(column, key)
    .maybeSingle()
  if (currentError) throw currentError
  if (!current) return { result: 'notFound' }
  return {
    result: current.status === 'cancelled' ? 'cancelled' : 'alreadyCheckedIn',
    participant: current,
  }
}
